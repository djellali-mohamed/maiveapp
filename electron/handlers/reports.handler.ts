import { ipcMain } from 'electron';
import { getDatabase } from '../../src/db/migrate';

export function setupReportHandlers() {
  // Get daily summary
  ipcMain.handle('reports:dailySummary', (_, date?: string) => {
    const db = getDatabase();
    const targetDate = date || new Date().toISOString().slice(0, 10);

    // Total revenue
    const revenueResult = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM transactions
      WHERE DATE(created_at) = ?
      AND status IN ('completed', 'partial_refund')
    `).get(targetDate) as { total: number };

    // Transaction count
    const countResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE DATE(created_at) = ?
      AND status IN ('completed', 'partial_refund')
    `).get(targetDate) as { count: number };

    // Average basket
    const avgBasket = countResult.count > 0 
      ? Math.round(revenueResult.total / countResult.count) 
      : 0;

    // Payment method breakdown
    const paymentMethods = db.prepare(`
      SELECT payment_method, COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM transactions
      WHERE DATE(created_at) = ?
      AND status IN ('completed', 'partial_refund')
      GROUP BY payment_method
    `).all(targetDate);

    // Discounts given
    const discountResult = db.prepare(`
      SELECT COALESCE(SUM(discount_amount), 0) as total
      FROM transactions
      WHERE DATE(created_at) = ?
      AND status IN ('completed', 'partial_refund')
    `).get(targetDate) as { total: number };

    // Items sold
    const itemsResult = db.prepare(`
      SELECT COALESCE(SUM(ti.quantity), 0) as total
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE DATE(t.created_at) = ?
      AND t.status IN ('completed', 'partial_refund')
    `).get(targetDate) as { total: number };

    return {
      date: targetDate,
      revenue: revenueResult.total,
      transactionCount: countResult.count,
      averageBasket: avgBasket,
      paymentMethods,
      totalDiscounts: discountResult.total,
      itemsSold: itemsResult.total,
    };
  });

  // Get sales report for date range
  ipcMain.handle('reports:sales', (_, startDate: string, endDate: string) => {
    const db = getDatabase();

    // Daily breakdown
    const dailyBreakdown = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE DATE(created_at) BETWEEN ? AND ?
      AND status IN ('completed', 'partial_refund')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(startDate, endDate);

    // Total for period
    const totalResult = db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as transaction_count,
        COALESCE(SUM(discount_amount), 0) as discounts
      FROM transactions
      WHERE DATE(created_at) BETWEEN ? AND ?
      AND status IN ('completed', 'partial_refund')
    `).get(startDate, endDate) as { revenue: number; transaction_count: number; discounts: number };

    return {
      startDate,
      endDate,
      totalRevenue: totalResult.revenue,
      totalTransactions: totalResult.transaction_count,
      totalDiscounts: totalResult.discounts,
      averageBasket: totalResult.transaction_count > 0 
        ? Math.round(totalResult.revenue / totalResult.transaction_count) 
        : 0,
      dailyBreakdown,
    };
  });

  // Get top products
  ipcMain.handle('reports:topProducts', (_, limit: number = 5, startDate?: string, endDate?: string) => {
    const db = getDatabase();
    
    let dateFilter = '';
    const params: any[] = [limit];
    
    if (startDate && endDate) {
      dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
      params.unshift(startDate, endDate);
    }

    return db.prepare(`
      SELECT 
        ti.product_id,
        ti.product_name,
        p.sku,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.line_total) as total_revenue,
        COUNT(DISTINCT ti.transaction_id) as times_sold
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      JOIN products p ON ti.product_id = p.id
      WHERE t.status IN ('completed', 'partial_refund')
      ${dateFilter}
      GROUP BY ti.product_id, ti.product_name, p.sku
      ORDER BY total_quantity DESC
      LIMIT ?
    `).all(...params);
  });

  // Get payment method breakdown
  ipcMain.handle('reports:paymentMethods', (_, startDate?: string, endDate?: string) => {
    const db = getDatabase();
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    return db.prepare(`
      SELECT 
        payment_method,
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE status IN ('completed', 'partial_refund')
      ${dateFilter}
      GROUP BY payment_method
    `).all(...params);
  });
}
