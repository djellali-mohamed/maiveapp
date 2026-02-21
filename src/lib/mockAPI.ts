// Mock API for browser preview
import { seedProducts, seedCashiers } from '../db/seed';

export const mockElectronAPI = {
  getProducts: async () => {
    // Return seed products with some extra fields the UI expects
    return seedProducts.map((p, i) => ({
      id: i + 1,
      ...p,
      total_stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
      lowStockThreshold: 3,
      isActive: true
    }));
  },
  getVariants: async (productId: number) => {
    const product = seedProducts[productId - 1];
    return product ? product.variants.map((v, i) => ({ id: i + 1, ...v, is_active: true })) : [];
  },
  getCashiers: async () => {
    return seedCashiers.map((c, i) => ({ id: i + 1, ...c }));
  },
  verifyPin: async (pin: string) => {
    const cashier = seedCashiers.find(c => c.pin === pin);
    if (cashier) {
      return { id: 1, name: cashier.name, role: cashier.role };
    }
    return null;
  },
  getSettings: async () => ({
    business_name: 'MAIVÉ (Mock)',
    currency: 'DZD',
    language: 'fr'
  }),
  getTransactions: async () => [],
  getDailySummary: async () => ({
    revenue: 4500000,
    transactionCount: 12,
    averageBasket: 375000,
    paymentMethods: [
      { payment_method: 'cash', total: 2500000, count: 7 },
      { payment_method: 'card', total: 1500000, count: 4 },
      { payment_method: 'mobile', total: 500000, count: 1 }
    ],
    totalDiscounts: 50000,
    itemsSold: 15
  }),
  getTopProducts: async (limit: number = 5) => {
    return [
      { product_id: 1, product_name: 'Tote Signature', total_quantity: 5, total_revenue: 4750000 },
      { product_id: 2, product_name: 'Mini Bag Élégance', total_quantity: 4, total_revenue: 2200000 },
      { product_id: 4, product_name: 'Sac Épaule Classique', total_quantity: 3, total_revenue: 2340000 },
    ].slice(0, limit);
  },
  getSalesReport: async (startDate: string, endDate: string) => {
    // Generate some mock daily sales for the last 14 days
    const dailyBreakdown = [];
    const end = new Date(endDate);
    for (let i = 0; i < 14; i++) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        dailyBreakdown.push({
            date: d.toISOString().slice(0, 10),
            revenue: Math.floor(Math.random() * 1000000) + 500000,
            transactionCount: Math.floor(Math.random() * 5) + 5
        });
    }
    return { dailyBreakdown: dailyBreakdown.reverse() };
  },
  getCurrentDrawer: async () => ({ id: 1, cashier_id: 1, status: 'open', opening_float: 1000000 }),
  openDrawer: async () => ({ id: 1, status: 'open' }),
  createTransaction: async (data: unknown) => ({ id: Date.now(), ref: 'MOCK-' + Date.now(), ...(data as Record<string, unknown>) }),
  searchCustomers: async () => [],
  getPrinters: async () => ['Mock Printer'],
  getAppVersion: async () => '1.0.0-mock',
  printReceipt: async () => true,
  testPrint: async () => true,
};
