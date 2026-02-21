import { ipcMain } from 'electron';
import { getDatabase } from '../../src/db/migrate';

// Generate transaction reference: MAV-YYYYMMDD-XXXX
function generateTransactionRef(db: any): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `MAV-${today}`;
  
  // Get today's transaction count
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM transactions WHERE ref LIKE ?
  `).get(`${prefix}%`) as { count: number };
  
  const sequence = (result.count + 1).toString().padStart(4, '0');
  return `${prefix}-${sequence}`;
}

export function setupSalesHandlers() {
  // Get all transactions with filters
  ipcMain.handle('sales:getAll', (_, filters?: { startDate?: string; endDate?: string; status?: string }) => {
    const db = getDatabase();
    let query = `
      SELECT t.*, 
        c.name as customer_name,
        ca.name as cashier_name,
        COUNT(ti.id) as item_count
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN cashiers ca ON t.cashier_id = ca.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(filters.endDate);
    }

    if (filters?.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    query += ' GROUP BY t.id ORDER BY t.created_at DESC';

    return db.prepare(query).all(...params);
  });

  // Get single transaction with items
  ipcMain.handle('sales:getOne', (_, id: number) => {
    const db = getDatabase();
    const transaction = db.prepare(`
      SELECT t.*, 
        c.name as customer_name,
        ca.name as cashier_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN cashiers ca ON t.cashier_id = ca.id
      WHERE t.id = ?
    `).get(id);

    if (!transaction) return null;

    const items = db.prepare(`
      SELECT ti.*, p.sku as product_sku
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
    `).all(id);

    return { ...transaction, items };
  });

  // Create transaction
  ipcMain.handle('sales:create', (_, transaction: any) => {
    const db = getDatabase();
    
    const ref = generateTransactionRef(db);
    
    const result = db.prepare(`
      INSERT INTO transactions (
        ref, subtotal, discount_amount, discount_reason, total,
        payment_method, amount_tendered, change_given, cashier_id,
        customer_id, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref,
      transaction.subtotal,
      transaction.discountAmount || 0,
      transaction.discountReason || null,
      transaction.total,
      transaction.paymentMethod,
      transaction.amountTendered || null,
      transaction.changeGiven || null,
      transaction.cashierId || null,
      transaction.customerId || null,
      transaction.notes || null,
      'completed'
    );

    const transactionId = result.lastInsertRowid;

    // Insert transaction items
    const insertItem = db.prepare(`
      INSERT INTO transaction_items (
        transaction_id, product_id, variant_id, product_name,
        variant_label, quantity, unit_price, original_price, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of transaction.items) {
      insertItem.run(
        transactionId,
        item.productId,
        item.variantId || null,
        item.productName,
        item.variantLabel || null,
        item.quantity,
        item.unitPrice,
        item.originalPrice,
        item.lineTotal
      );

      // Update stock
      if (item.variantId) {
        db.prepare('UPDATE variants SET stock_qty = stock_qty - ? WHERE id = ?')
          .run(item.quantity, item.variantId);
      }
    }

    // Update customer stats if customer exists
    if (transaction.customerId) {
      db.prepare(`
        UPDATE customers 
        SET total_spent = total_spent + ?, 
            visit_count = visit_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(transaction.total, transaction.customerId);
    }

    return { id: transactionId, ref, ...transaction };
  });

  // Refund transaction
  ipcMain.handle('sales:refund', (_, id: number, reason: string, itemIds?: number[]) => {
    const db = getDatabase();
    
    const originalTxn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!originalTxn) throw new Error('Transaction not found');

    // Get items to refund
    let itemsToRefund: any[];
    if (itemIds && itemIds.length > 0) {
      const placeholders = itemIds.map(() => '?').join(',');
      itemsToRefund = db.prepare(`
        SELECT * FROM transaction_items 
        WHERE transaction_id = ? AND id IN (${placeholders})
      `).all(id, ...itemIds);
    } else {
      itemsToRefund = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(id);
    }

    // Calculate refund amount
    const refundAmount = itemsToRefund.reduce((sum, item) => sum + item.line_total, 0);

    // Create refund transaction
    const ref = generateTransactionRef(db);
    const result = db.prepare(`
      INSERT INTO transactions (
        ref, subtotal, total, payment_method, cashier_id,
        customer_id, notes, status, original_txn_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref,
      -refundAmount,
      -refundAmount,
      originalTxn.payment_method,
      originalTxn.cashier_id,
      originalTxn.customer_id,
      `Refund: ${reason}`,
      itemIds && itemIds.length > 0 ? 'partial_refund' : 'refunded',
      id
    );

    const refundId = result.lastInsertRowid;

    // Insert refund items
    const insertItem = db.prepare(`
      INSERT INTO transaction_items (
        transaction_id, product_id, variant_id, product_name,
        variant_label, quantity, unit_price, original_price, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of itemsToRefund) {
      insertItem.run(
        refundId,
        item.product_id,
        item.variant_id,
        item.product_name,
        item.variant_label,
        -item.quantity,
        item.unit_price,
        item.original_price,
        -item.line_total
      );

      // Restore stock
      if (item.variant_id) {
        db.prepare('UPDATE variants SET stock_qty = stock_qty + ? WHERE id = ?')
          .run(item.quantity, item.variant_id);
      }
    }

    // Update original transaction status
    const newStatus = itemIds && itemIds.length > 0 ? 'partial_refund' : 'refunded';
    db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run(newStatus, id);

    return { id: refundId, ref, amount: -refundAmount };
  });

  // Void transaction
  ipcMain.handle('sales:void', (_, id: number, reason: string) => {
    const db = getDatabase();
    
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!transaction) throw new Error('Transaction not found');

    // Restore stock for all items
    const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(id) as any[];
    for (const item of items) {
      if (item.variant_id) {
        db.prepare('UPDATE variants SET stock_qty = stock_qty + ? WHERE id = ?')
          .run(item.quantity, item.variant_id);
      }
    }

    // Update transaction status
    db.prepare('UPDATE transactions SET status = ?, notes = ? WHERE id = ?')
      .run('voided', `Voided: ${reason}`, id);

    return true;
  });

  // Get daily transactions
  ipcMain.handle('sales:getDaily', (_, date?: string) => {
    const db = getDatabase();
    const targetDate = date || new Date().toISOString().slice(0, 10);
    
    return db.prepare(`
      SELECT t.*, 
        c.name as customer_name,
        ca.name as cashier_name,
        COUNT(ti.id) as item_count
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN cashiers ca ON t.cashier_id = ca.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE DATE(t.created_at) = ? AND t.status IN ('completed', 'partial_refund')
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all(targetDate);
  });
}
