import { ipcMain } from 'electron';
import { getDatabase } from '../../src/db/migrate';

export function setupProductHandlers() {
  // Get all products with optional filters
  ipcMain.handle('products:getAll', (_, filters?: { category?: string; search?: string }) => {
    const db = getDatabase();
    let query = `
      SELECT p.*, 
        COUNT(v.id) as variant_count,
        SUM(v.stock_qty) as total_stock
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      WHERE p.is_active = 1
    `;
    const params: any[] = [];

    if (filters?.category && filters.category !== 'all') {
      query += ' AND p.category = ?';
      params.push(filters.category);
    }

    if (filters?.search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.name_en LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY p.id ORDER BY p.name';

    const products = db.prepare(query).all(...params);
    return products;
  });

  // Get single product with variants
  ipcMain.handle('products:getOne', (_, id: number) => {
    const db = getDatabase();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) return null;

    const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? AND is_active = 1').all(id);
    return { ...product, variants };
  });

  // Create product
  ipcMain.handle('products:create', (_, product: any) => {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO products (sku, name, name_en, description, category, base_price, cost_price, barcode, low_stock_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.sku,
      product.name,
      product.nameEn || null,
      product.description || null,
      product.category,
      product.basePrice,
      product.costPrice || null,
      product.barcode || null,
      product.lowStockThreshold || 3
    );

    return { id: result.lastInsertRowid, ...product };
  });

  // Update product
  ipcMain.handle('products:update', (_, id: number, product: any) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE products SET
        sku = ?,
        name = ?,
        name_en = ?,
        description = ?,
        category = ?,
        base_price = ?,
        cost_price = ?,
        barcode = ?,
        low_stock_threshold = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      product.sku,
      product.name,
      product.nameEn || null,
      product.description || null,
      product.category,
      product.basePrice,
      product.costPrice || null,
      product.barcode || null,
      product.lowStockThreshold || 3,
      product.isActive !== undefined ? (product.isActive ? 1 : 0) : 1,
      id
    );

    return { id, ...product };
  });

  // Delete product (soft delete)
  ipcMain.handle('products:delete', (_, id: number) => {
    const db = getDatabase();
    db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return true;
  });

  // Update stock quantity
  ipcMain.handle('products:updateStock', (_, variantId: number, quantity: number) => {
    const db = getDatabase();
    db.prepare('UPDATE variants SET stock_qty = ? WHERE id = ?').run(quantity, variantId);
    return true;
  });

  // Variant handlers
  ipcMain.handle('variants:getByProduct', (_, productId: number) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM variants WHERE product_id = ? AND is_active = 1').all(productId);
  });

  ipcMain.handle('variants:create', (_, variant: any) => {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO variants (product_id, color, color_hex, size, sku, price_override, stock_qty, barcode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      variant.productId,
      variant.color || null,
      variant.colorHex || null,
      variant.size || null,
      variant.sku,
      variant.priceOverride || null,
      variant.stockQty || 0,
      variant.barcode || null
    );

    return { id: result.lastInsertRowid, ...variant };
  });

  ipcMain.handle('variants:update', (_, id: number, variant: any) => {
    const db = getDatabase();
    db.prepare(`
      UPDATE variants SET
        color = ?,
        color_hex = ?,
        size = ?,
        sku = ?,
        price_override = ?,
        stock_qty = ?,
        barcode = ?,
        is_active = ?
      WHERE id = ?
    `).run(
      variant.color || null,
      variant.colorHex || null,
      variant.size || null,
      variant.sku,
      variant.priceOverride || null,
      variant.stockQty || 0,
      variant.barcode || null,
      variant.isActive !== undefined ? (variant.isActive ? 1 : 0) : 1,
      id
    );

    return { id, ...variant };
  });

  ipcMain.handle('variants:delete', (_, id: number) => {
    const db = getDatabase();
    db.prepare('UPDATE variants SET is_active = 0 WHERE id = ?').run(id);
    return true;
  });
}
