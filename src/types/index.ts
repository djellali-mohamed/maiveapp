// Shared types for MAIVÉ POS

export interface Variant {
  id: number;
  color: string;
  colorHex: string;
  stockQty: number;
  priceOverride?: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  nameEn?: string;
  category: string;
  basePrice: number;
  images?: string;
  total_stock: number;
  lowStockThreshold: number;
  variants: Variant[];
}

export interface CartItem {
  id: string;
  productId: number;
  variantId?: number;
  name: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  colorHex?: string;
}

export interface Transaction {
  id: number;
  ref: string;
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  amountTendered?: number;
  changeGiven?: number;
  cashierId?: number;
  customerId?: number;
  notes?: string;
  status: 'completed' | 'refunded' | 'partial_refund' | 'voided';
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  wilaya?: string;
  totalSpent: number;
  visitCount: number;
}

export interface Cashier {
  id: number;
  name: string;
  role: 'admin' | 'cashier';
  isActive: boolean;
}
