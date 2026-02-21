import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  sku:               text('sku').unique().notNull(),
  name:              text('name').notNull(),
  nameEn:            text('name_en'),
  description:       text('description'),
  category:          text('category').notNull(), // totes|mini_bags|pochettes|epaule|bandouliere|soiree
  basePrice:         integer('base_price').notNull(),   // centimes
  costPrice:         integer('cost_price'),
  images:            text('images').default('[]'),
  barcode:           text('barcode'),
  isActive:          integer('is_active', { mode: 'boolean' }).default(true),
  lowStockThreshold: integer('low_stock_threshold').default(3),
  createdAt:         text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:         text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const variants = sqliteTable('variants', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  productId:     integer('product_id').notNull().references(() => products.id),
  color:         text('color'),
  colorHex:      text('color_hex'),
  size:          text('size'),
  sku:           text('sku').unique().notNull(),
  priceOverride: integer('price_override'),
  stockQty:      integer('stock_qty').default(0).notNull(),
  barcode:       text('barcode'),
  isActive:      integer('is_active', { mode: 'boolean' }).default(true),
});

export const transactions = sqliteTable('transactions', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  ref:            text('ref').unique().notNull(),         // MAV-YYYYMMDD-XXXX
  subtotal:       integer('subtotal').notNull(),
  discountAmount: integer('discount_amount').default(0),
  discountReason: text('discount_reason'),
  total:          integer('total').notNull(),
  paymentMethod:  text('payment_method').notNull(),       // cash|card|mobile
  amountTendered: integer('amount_tendered'),
  changeGiven:    integer('change_given'),
  cashierId:      integer('cashier_id'),
  customerId:     integer('customer_id'),
  notes:          text('notes'),
  status:         text('status').default('completed'),    // completed|refunded|partial_refund|voided
  originalTxnId:  integer('original_txn_id'),
  createdAt:      text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const transactionItems = sqliteTable('transaction_items', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id').notNull().references(() => transactions.id),
  productId:     integer('product_id').notNull(),
  variantId:     integer('variant_id'),
  productName:   text('product_name').notNull(),
  variantLabel:  text('variant_label'),
  quantity:      integer('quantity').notNull(),
  unitPrice:     integer('unit_price').notNull(),         // actual price charged (may be negotiated)
  originalPrice: integer('original_price').notNull(),     // listed price
  lineTotal:     integer('line_total').notNull(),
});

export const customers = sqliteTable('customers', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  name:       text('name').notNull(),
  phone:      text('phone'),
  email:      text('email'),
  wilaya:     text('wilaya'),
  totalSpent: integer('total_spent').default(0),
  visitCount: integer('visit_count').default(0),
  notes:      text('notes'),
  createdAt:  text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const cashiers = sqliteTable('cashiers', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  name:     text('name').notNull(),
  pin:      text('pin').notNull(),
  role:     text('role').default('cashier'),              // admin|cashier
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

export const drawerSessions = sqliteTable('drawer_sessions', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  cashierId:    integer('cashier_id'),
  openingFloat: integer('opening_float').notNull(),
  closingCount: integer('closing_count'),
  expectedCash: integer('expected_cash'),
  discrepancy:  integer('discrepancy'),
  openedAt:     text('opened_at').default(sql`CURRENT_TIMESTAMP`),
  closedAt:     text('closed_at'),
  notes:        text('notes'),
});

export const settings = sqliteTable('settings', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  key:         text('key').unique().notNull(),
  value:       text('value').notNull(),
  updatedAt:   text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Variant = typeof variants.$inferSelect;
export type NewVariant = typeof variants.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Cashier = typeof cashiers.$inferSelect;
export type NewCashier = typeof cashiers.$inferInsert;
export type DrawerSession = typeof drawerSessions.$inferSelect;
export type NewDrawerSession = typeof drawerSessions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
