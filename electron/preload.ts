import { contextBridge, ipcRenderer } from 'electron';

// API exposed to the renderer process
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

const api: ElectronAPI = {
  // Products
  getProducts: (filters) => ipcRenderer.invoke('products:getAll', filters),
  getProduct: (id) => ipcRenderer.invoke('products:getOne', id),
  createProduct: (product) => ipcRenderer.invoke('products:create', product),
  updateProduct: (id, product) => ipcRenderer.invoke('products:update', id, product),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  updateStock: (variantId, quantity) => ipcRenderer.invoke('products:updateStock', variantId, quantity),
  
  // Variants
  getVariants: (productId) => ipcRenderer.invoke('variants:getByProduct', productId),
  createVariant: (variant) => ipcRenderer.invoke('variants:create', variant),
  updateVariant: (id, variant) => ipcRenderer.invoke('variants:update', id, variant),
  deleteVariant: (id) => ipcRenderer.invoke('variants:delete', id),
  
  // Sales / Transactions
  getTransactions: (filters) => ipcRenderer.invoke('sales:getAll', filters),
  getTransaction: (id) => ipcRenderer.invoke('sales:getOne', id),
  createTransaction: (transaction) => ipcRenderer.invoke('sales:create', transaction),
  refundTransaction: (id, reason, items) => ipcRenderer.invoke('sales:refund', id, reason, items),
  voidTransaction: (id, reason) => ipcRenderer.invoke('sales:void', id, reason),
  getDailyTransactions: (date) => ipcRenderer.invoke('sales:getDaily', date),
  
  // Customers
  getCustomers: () => ipcRenderer.invoke('customers:getAll'),
  getCustomer: (id) => ipcRenderer.invoke('customers:getOne', id),
  createCustomer: (customer) => ipcRenderer.invoke('customers:create', customer),
  updateCustomer: (id, customer) => ipcRenderer.invoke('customers:update', id, customer),
  searchCustomers: (query) => ipcRenderer.invoke('customers:search', query),
  
  // Cashiers
  getCashiers: () => ipcRenderer.invoke('cashiers:getAll'),
  createCashier: (cashier) => ipcRenderer.invoke('cashiers:create', cashier),
  updateCashier: (id, cashier) => ipcRenderer.invoke('cashiers:update', id, cashier),
  deleteCashier: (id) => ipcRenderer.invoke('cashiers:delete', id),
  verifyPin: (pin) => ipcRenderer.invoke('cashiers:verifyPin', pin),
  
  // Reports
  getDailySummary: (date) => ipcRenderer.invoke('reports:dailySummary', date),
  getSalesReport: (startDate, endDate) => ipcRenderer.invoke('reports:sales', startDate, endDate),
  getTopProducts: (limit, startDate, endDate) => ipcRenderer.invoke('reports:topProducts', limit, startDate, endDate),
  getPaymentMethodBreakdown: (startDate, endDate) => ipcRenderer.invoke('reports:paymentMethods', startDate, endDate),
  
  // Drawer Sessions
  openDrawer: (cashierId, openingFloat) => ipcRenderer.invoke('drawer:open', cashierId, openingFloat),
  closeDrawer: (sessionId, closingCount, notes) => ipcRenderer.invoke('drawer:close', sessionId, closingCount, notes),
  getCurrentDrawer: () => ipcRenderer.invoke('drawer:getCurrent'),
  
  // Printer
  printReceipt: (transactionId) => ipcRenderer.invoke('printer:printReceipt', transactionId),
  testPrint: () => ipcRenderer.invoke('printer:test'),
  getPrinters: () => ipcRenderer.invoke('printer:getList'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  
  // Database
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  
  // App
  getAppVersion: () => ipcRenderer.invoke('app:version'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

// Type declaration for the renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
