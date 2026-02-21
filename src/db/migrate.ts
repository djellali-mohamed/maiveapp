import type { Database } from 'better-sqlite3';
import BetterSQLite3 from 'better-sqlite3';
import { seedDatabase } from './seed';

const dbPath = process.env.DATABASE_PATH || './maive-pos.db';

export function initializeDatabase(dbPath: string): Database {
  const db = new BetterSQLite3(dbPath);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT,
      description TEXT,
      category TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      cost_price INTEGER,
      images TEXT DEFAULT '[]',
      barcode TEXT,
      is_active INTEGER DEFAULT 1,
      low_stock_threshold INTEGER DEFAULT 3,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      color TEXT,
      color_hex TEXT,
      size TEXT,
      sku TEXT UNIQUE NOT NULL,
      price_override INTEGER,
      stock_qty INTEGER DEFAULT 0 NOT NULL,
      barcode TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT UNIQUE NOT NULL,
      subtotal INTEGER NOT NULL,
      discount_amount INTEGER DEFAULT 0,
      discount_reason TEXT,
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      amount_tendered INTEGER,
      change_given INTEGER,
      cashier_id INTEGER,
      customer_id INTEGER,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      original_txn_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      product_name TEXT NOT NULL,
      variant_label TEXT,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      original_price INTEGER NOT NULL,
      line_total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      wilaya TEXT,
      total_spent INTEGER DEFAULT 0,
      visit_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cashiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      role TEXT DEFAULT 'cashier',
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS drawer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cashier_id INTEGER,
      opening_float INTEGER NOT NULL,
      closing_count INTEGER,
      expected_cash INTEGER,
      discrepancy INTEGER,
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(ref);
    CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
  `);

  // Seed database with initial data
  seedDatabase(db);

  return db;
}

// Initialize database on module load
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = initializeDatabase(dbPath);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
