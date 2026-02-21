// Type declarations for Electron API

export interface ElectronAPI {
  // Products
  getProducts: (filters?: { category?: string; search?: string }) => Promise<any[]>;
  getProduct: (id: number) => Promise<any>;
  createProduct: (product: any) => Promise<any>;
  updateProduct: (id: number, product: any) => Promise<any>;
  deleteProduct: (id: number) => Promise<boolean>;
  updateStock: (variantId: number, quantity: number) => Promise<boolean>;
  
  // Variants
  getVariants: (productId: number) => Promise<any[]>;
  createVariant: (variant: any) => Promise<any>;
  updateVariant: (id: number, variant: any) => Promise<any>;
  deleteVariant: (id: number) => Promise<boolean>;
  
  // Sales / Transactions
  getTransactions: (filters?: { startDate?: string; endDate?: string; status?: string }) => Promise<any[]>;
  getTransaction: (id: number) => Promise<any>;
  createTransaction: (transaction: any) => Promise<any>;
  refundTransaction: (id: number, reason: string, items?: number[]) => Promise<any>;
  voidTransaction: (id: number, reason: string) => Promise<boolean>;
  getDailyTransactions: (date?: string) => Promise<any[]>;
  
  // Customers
  getCustomers: () => Promise<any[]>;
  getCustomer: (id: number) => Promise<any>;
  createCustomer: (customer: any) => Promise<any>;
  updateCustomer: (id: number, customer: any) => Promise<any>;
  searchCustomers: (query: string) => Promise<any[]>;
  
  // Cashiers
  getCashiers: () => Promise<any[]>;
  createCashier: (cashier: any) => Promise<any>;
  updateCashier: (id: number, cashier: any) => Promise<any>;
  deleteCashier: (id: number) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<any>;
  
  // Reports
  getDailySummary: (date?: string) => Promise<any>;
  getSalesReport: (startDate: string, endDate: string) => Promise<any>;
  getTopProducts: (limit?: number, startDate?: string, endDate?: string) => Promise<any[]>;
  getPaymentMethodBreakdown: (startDate?: string, endDate?: string) => Promise<any>;
  
  // Drawer Sessions
  openDrawer: (cashierId: number, openingFloat: number) => Promise<any>;
  closeDrawer: (sessionId: number, closingCount: number, notes?: string) => Promise<any>;
  getCurrentDrawer: () => Promise<any>;
  
  // Printer
  printReceipt: (transactionId: number) => Promise<boolean>;
  testPrint: () => Promise<boolean>;
  getPrinters: () => Promise<string[]>;
  
  // Settings
  getSettings: () => Promise<Record<string, string>>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<boolean>;
  
  // Database
  backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>;
  
  // App
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
