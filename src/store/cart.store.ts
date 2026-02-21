import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: number;
  variantId?: number;
  name: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;      // actual price (may be negotiated)
  originalPrice: number;  // listed price
  colorHex?: string;
}

interface CartState {
  items: CartItem[];
  discountAmount: number;
  discountReason?: string;
  discountType: 'percentage' | 'fixed';
  customerId?: number;
  customerName?: string;
  notes?: string;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updatePrice: (id: string, newPrice: number, reason: string) => void;
  setDiscount: (amount: number, type: 'percentage' | 'fixed', reason?: string) => void;
  clearDiscount: () => void;
  setCustomer: (id: number, name: string) => void;
  clearCustomer: () => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discountAmount: 0,
      discountType: 'fixed',
      customerId: undefined,
      customerName: undefined,
      notes: undefined,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, id: `${item.productId}-${item.variantId || 'base'}-${Date.now()}` }],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      updatePrice: (id, newPrice, reason) => {
        const item = get().items.find((i) => i.id === id);
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, unitPrice: newPrice } : i
          ),
        });
        // Store the negotiation reason in notes if provided
        if (reason && item) {
          const currentNotes = get().notes || '';
          set({ notes: currentNotes + `\nPrix négocié (${item.name}): ${reason}` });
        }
      },

      setDiscount: (amount, type, reason) => {
        set({ discountAmount: amount, discountType: type, discountReason: reason });
      },

      clearDiscount: () => {
        set({ discountAmount: 0, discountReason: undefined });
      },

      setCustomer: (id, name) => {
        set({ customerId: id, customerName: name });
      },

      clearCustomer: () => {
        set({ customerId: undefined, customerName: undefined });
      },

      setNotes: (notes) => {
        set({ notes });
      },

      clearCart: () => {
        set({
          items: [],
          discountAmount: 0,
          discountReason: undefined,
          customerId: undefined,
          customerName: undefined,
          notes: undefined,
        });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const { discountAmount, discountType } = get();
        
        if (discountType === 'percentage') {
          return Math.round(subtotal * (1 - discountAmount / 100));
        }
        return Math.max(0, subtotal - discountAmount);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'maive-cart',
      partialize: (state) => ({
        items: state.items,
        discountAmount: state.discountAmount,
        discountType: state.discountType,
        discountReason: state.discountReason,
        customerId: state.customerId,
        customerName: state.customerName,
        notes: state.notes,
      }),
    }
  )
);
