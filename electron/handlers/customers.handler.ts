import { ipcMain } from 'electron';
import { getDatabase } from '../../src/db/migrate';

export function setupCustomerHandlers() {
  // Get all customers
  ipcMain.handle('customers:getAll', () => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM customers 
      ORDER BY name ASC
    `).all();
  });

  // Get single customer
  ipcMain.handle('customers:getOne', (_, id: number) => {
    const db = getDatabase();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) return null;

    // Get customer's transaction history
    const transactions = db.prepare(`
      SELECT id, ref, total, created_at, status
      FROM transactions
      WHERE customer_id = ? AND status IN ('completed', 'partial_refund')
      ORDER BY created_at DESC
      LIMIT 10
    `).all(id);

    return { ...customer, transactions };
  });

  // Create customer
  ipcMain.handle('customers:create', (_, customer: any) => {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, wilaya, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      customer.name,
      customer.phone || null,
      customer.email || null,
      customer.wilaya || null,
      customer.notes || null
    );

    return { id: result.lastInsertRowid, ...customer };
  });

  // Update customer
  ipcMain.handle('customers:update', (_, id: number, customer: any) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE customers SET
        name = ?,
        phone = ?,
        email = ?,
        wilaya = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      customer.name,
      customer.phone || null,
      customer.email || null,
      customer.wilaya || null,
      customer.notes || null,
      id
    );

    return { id, ...customer };
  });

  // Search customers
  ipcMain.handle('customers:search', (_, query: string) => {
    const db = getDatabase();
    const searchTerm = `%${query}%`;
    return db.prepare(`
      SELECT * FROM customers
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY name ASC
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);
  });

  // Cashier handlers
  ipcMain.handle('cashiers:getAll', () => {
    const db = getDatabase();
    return db.prepare('SELECT id, name, role, is_active FROM cashiers ORDER BY name').all();
  });

  ipcMain.handle('cashiers:create', (_, cashier: any) => {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO cashiers (name, pin, role, is_active)
      VALUES (?, ?, ?, ?)
    `).run(
      cashier.name,
      cashier.pin,
      cashier.role || 'cashier',
      cashier.isActive !== undefined ? (cashier.isActive ? 1 : 0) : 1
    );

    return { id: result.lastInsertRowid, ...cashier };
  });

  ipcMain.handle('cashiers:update', (_, id: number, cashier: any) => {
    const db = getDatabase();
    
    let query = 'UPDATE cashiers SET name = ?, role = ?, is_active = ?';
    const params: any[] = [cashier.name, cashier.role || 'cashier', cashier.isActive !== undefined ? (cashier.isActive ? 1 : 0) : 1];
    
    if (cashier.pin) {
      query += ', pin = ?';
      params.push(cashier.pin);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    db.prepare(query).run(...params);
    return { id, ...cashier };
  });

  ipcMain.handle('cashiers:delete', (_, id: number) => {
    const db = getDatabase();
    db.prepare('UPDATE cashiers SET is_active = 0 WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('cashiers:verifyPin', (_, pin: string) => {
    const db = getDatabase();
    const cashier = db.prepare(`
      SELECT id, name, role FROM cashiers 
      WHERE pin = ? AND is_active = 1
    `).get(pin);
    return cashier || null;
  });

  // Drawer session handlers
  ipcMain.handle('drawer:open', (_, cashierId: number, openingFloat: number) => {
    const db = getDatabase();
    
    // Check if there's already an open drawer
    const existing = db.prepare(`
      SELECT * FROM drawer_sessions WHERE closed_at IS NULL
    `).get();
    
    if (existing) {
      throw new Error('A drawer session is already open');
    }

    const result = db.prepare(`
      INSERT INTO drawer_sessions (cashier_id, opening_float)
      VALUES (?, ?)
    `).run(cashierId, openingFloat);

    return { id: result.lastInsertRowid, cashierId, openingFloat };
  });

  ipcMain.handle('drawer:close', (_, sessionId: number, closingCount: number, notes?: string) => {
    const db = getDatabase();
    
    const session = db.prepare('SELECT * FROM drawer_sessions WHERE id = ?').get(sessionId) as any;
    if (!session) throw new Error('Drawer session not found');

    // Calculate expected cash
    const cashSales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM transactions
      WHERE payment_method = 'cash' 
      AND DATE(created_at) = DATE(?)
      AND status IN ('completed', 'partial_refund')
    `).get(session.opened_at) as { total: number };

    const expectedCash = session.opening_float + (cashSales.total || 0);
    const discrepancy = closingCount - expectedCash;

    db.prepare(`
      UPDATE drawer_sessions SET
        closing_count = ?,
        expected_cash = ?,
        discrepancy = ?,
        closed_at = CURRENT_TIMESTAMP,
        notes = ?
      WHERE id = ?
    `).run(closingCount, expectedCash, discrepancy, notes || null, sessionId);

    return { 
      id: sessionId, 
      openingFloat: session.opening_float,
      closingCount, 
      expectedCash, 
      discrepancy 
    };
  });

  ipcMain.handle('drawer:getCurrent', () => {
    const db = getDatabase();
    const session = db.prepare(`
      SELECT ds.*, c.name as cashier_name
      FROM drawer_sessions ds
      LEFT JOIN cashiers c ON ds.cashier_id = c.id
      WHERE ds.closed_at IS NULL
    `).get();
    return session || null;
  });

  // Settings handlers
  ipcMain.handle('settings:getAll', () => {
    const db = getDatabase();
    const settings = db.prepare('SELECT key, value FROM settings').all() as any[];
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  });

  ipcMain.handle('settings:get', (_, key: string) => {
    const db = getDatabase();
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return result?.value || null;
  });

  ipcMain.handle('settings:set', (_, key: string, value: string) => {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).run(key, value, value);
    return true;
  });
}
