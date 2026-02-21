import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductGrid } from '../components/pos/ProductGrid';
import { Cart } from '../components/pos/Cart';
import { CheckoutModal } from '../components/pos/CheckoutModal';
import { useCartStore } from '../store/cart.store';
import { useUIStore } from '../store/ui.store';

interface Product {
  id: number;
  name: string;
  basePrice: number;
  total_stock: number;
  lowStockThreshold: number;
  variants: any[];
}

interface Variant {
  id: number;
  color: string;
  colorHex: string;
  stockQty: number;
  priceOverride?: number;
}

export function POSPage() {
  const { t } = useTranslation();
  const [showCheckout, setShowCheckout] = useState(false);
  const { addItem, clearCart } = useCartStore();
  const { addToast } = useUIStore();

  const handleAddToCart = useCallback((product: Product, variant?: Variant) => {
    const price = variant?.priceOverride || product.basePrice;
    const variantLabel = variant ? `${variant.color}` : undefined;

    addItem({
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantLabel,
      quantity: 1,
      unitPrice: price,
      originalPrice: product.basePrice,
      colorHex: variant?.colorHex,
    });

    addToast(`${product.name} ajouté au panier`, 'success');
  }, [addItem, addToast]);

  const handleCheckoutSuccess = (transaction: any) => {
    // Transaction completed successfully
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F4') {
      e.preventDefault();
      setShowCheckout(true);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Product Grid */}
      <div className="flex-1 min-w-0">
        <ProductGrid onAddToCart={handleAddToCart} />
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex-shrink-0">
        <Cart onCheckout={() => setShowCheckout(true)} />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
