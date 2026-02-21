import { Database } from 'better-sqlite3';

// Seed data for MAIVÉ POS
// Prices in centimes (DZD × 100)
// REAL PRICE RANGE: 1 000 DZD → 10 000 DZD = 100000 → 1000000 centimes

export const seedProducts = [
  { 
    name: 'Tote Signature', 
    nameEn: 'Signature Tote', 
    category: 'totes', 
    basePrice: 950000,
    sku: 'TOT-SIG-001',
    variants: [
      { color: 'Noir', colorHex: '#1A1611', stock: 8, sku: 'TOT-SIG-001-NOIR' },
      { color: 'Camel', colorHex: '#C4956A', stock: 5, sku: 'TOT-SIG-001-CAMEL' },
      { color: 'Beige', colorHex: '#D4C4A8', stock: 3, sku: 'TOT-SIG-001-BEIGE' },
    ]
  },
  { 
    name: 'Mini Bag Élégance', 
    nameEn: 'Élégance Mini Bag', 
    category: 'mini_bags', 
    basePrice: 550000,
    sku: 'MIN-ELE-001',
    variants: [
      { color: 'Noir', colorHex: '#1A1611', stock: 12, sku: 'MIN-ELE-001-NOIR' },
      { color: 'Crème', colorHex: '#F5F0E8', stock: 6, sku: 'MIN-ELE-001-CREME' },
    ]
  },
  { 
    name: 'Pochette Soir', 
    nameEn: 'Evening Clutch', 
    category: 'pochettes', 
    basePrice: 320000,
    sku: 'POC-SOI-001',
    variants: [
      { color: 'Or', colorHex: '#BFA16B', stock: 4, sku: 'POC-SOI-001-OR' },
      { color: 'Noir', colorHex: '#1A1611', stock: 7, sku: 'POC-SOI-001-NOIR' },
    ]
  },
  { 
    name: 'Sac Épaule Classique', 
    nameEn: 'Classic Shoulder Bag', 
    category: 'epaule', 
    basePrice: 780000,
    sku: 'SAC-EPA-001',
    variants: [
      { color: 'Camel', colorHex: '#C4956A', stock: 5, sku: 'SAC-EPA-001-CAMEL' },
      { color: 'Noir', colorHex: '#1A1611', stock: 4, sku: 'SAC-EPA-001-NOIR' },
      { color: 'Beige', colorHex: '#D4C4A8', stock: 2, sku: 'SAC-EPA-001-BEIGE' },
    ]
  },
  { 
    name: 'Bandoulière Voyage', 
    nameEn: 'Travel Crossbody', 
    category: 'bandouliere', 
    basePrice: 650000,
    sku: 'BAN-VOY-001',
    variants: [
      { color: 'Camel', colorHex: '#C4956A', stock: 9, sku: 'BAN-VOY-001-CAMEL' },
      { color: 'Noir', colorHex: '#1A1611', stock: 6, sku: 'BAN-VOY-001-NOIR' },
    ]
  },
  { 
    name: 'Sac Soirée Prestige', 
    nameEn: 'Prestige Evening Bag', 
    category: 'soiree', 
    basePrice: 1000000,
    sku: 'SAC-SOI-001',
    variants: [
      { color: 'Or', colorHex: '#BFA16B', stock: 3, sku: 'SAC-SOI-001-OR' },
      { color: 'Noir', colorHex: '#1A1611', stock: 4, sku: 'SAC-SOI-001-NOIR' },
    ]
  },
  { 
    name: 'Mini Pochette Quotidien', 
    nameEn: 'Daily Mini Clutch', 
    category: 'pochettes', 
    basePrice: 100000,
    sku: 'MIN-POC-001',
    variants: [
      { color: 'Beige', colorHex: '#D4C4A8', stock: 15, sku: 'MIN-POC-001-BEIGE' },
      { color: 'Camel', colorHex: '#C4956A', stock: 10, sku: 'MIN-POC-001-CAMEL' },
    ]
  },
  { 
    name: 'Sac Bandoulière Léger', 
    nameEn: 'Light Crossbody', 
    category: 'bandouliere', 
    basePrice: 450000,
    sku: 'SAC-BAN-001',
    variants: [
      { color: 'Crème', colorHex: '#F5F0E8', stock: 7, sku: 'SAC-BAN-001-CREME' },
      { color: 'Noir', colorHex: '#1A1611', stock: 5, sku: 'SAC-BAN-001-NOIR' },
    ]
  },
];

export const seedCashiers = [
  { name: 'Admin', pin: '1234', role: 'admin', isActive: true },
  { name: 'Caissier 1', pin: '0000', role: 'cashier', isActive: true },
];

export function seedDatabase(db: Database) {
  // Check if already seeded
  const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (existingProducts.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Insert products and variants
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, name, name_en, category, base_price, is_active, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO variants (product_id, color, color_hex, sku, stock_qty, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const product of seedProducts) {
    const result = insertProduct.run(
      product.sku,
      product.name,
      product.nameEn,
      product.category,
      product.basePrice,
      true,
      3
    );

    const productId = result.lastInsertRowid;

    for (const variant of product.variants) {
      insertVariant.run(
        productId,
        variant.color,
        variant.colorHex,
        variant.sku,
        variant.stock,
        true
      );
    }
  }

  // Insert cashiers
  const insertCashier = db.prepare(`
    INSERT INTO cashiers (name, pin, role, is_active)
    VALUES (?, ?, ?, ?)
  `);

  for (const cashier of seedCashiers) {
    insertCashier.run(cashier.name, cashier.pin, cashier.role, cashier.isActive);
  }

  // Insert default settings
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
  `);

  const defaultSettings = [
    { key: 'business_name', value: 'MAIVÉ' },
    { key: 'business_phone', value: '' },
    { key: 'business_address', value: '' },
    { key: 'receipt_footer', value: 'Merci pour votre confiance.\nRetours acceptés sous 7 jours.' },
    { key: 'language', value: 'fr' },
    { key: 'currency', value: 'DZD' },
  ];

  for (const setting of defaultSettings) {
    insertSetting.run(setting.key, setting.value);
  }

  console.log('Database seeded successfully!');
}
