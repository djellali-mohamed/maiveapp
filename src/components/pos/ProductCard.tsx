import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { formatDZD } from '../../utils/currency';
import type { Product, Variant } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variant?: Variant) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    product.variants?.[0]
  );

  const isOutOfStock = product.total_stock <= 0;
  const isLowStock = product.total_stock > 0 && product.total_stock <= product.lowStockThreshold;

  const getPrice = () => {
    if (selectedVariant?.priceOverride) {
      return selectedVariant.priceOverride;
    }
    return product.basePrice;
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedVariant);
  };

  return (
    <div
      className={`group relative bg-maive-warm-white rounded-maive-md border transition-all duration-200 ${
        isOutOfStock
          ? 'border-maive-parchment opacity-60'
          : 'border-maive-parchment hover:border-maive-camel hover:shadow-maive-sm'
      }`}
    >
      {/* Image Placeholder */}
      <div className="aspect-square bg-maive-cream rounded-t-maive-md flex items-center justify-center overflow-hidden">
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-maive-noir/10 flex items-center justify-center">
            <span className="px-3 py-1 bg-maive-noir text-white text-xs font-body rounded-maive-sm">
              {t('pos.product.outOfStock')}
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-body rounded-maive-xs">
              <AlertTriangle className="w-3 h-3" />
              {t('pos.product.lowStock')}
            </span>
          </div>
        ) : null}
        
        {/* Placeholder for product image */}
        <div className="w-20 h-20 bg-maive-parchment rounded-maive-sm flex items-center justify-center">
          <span className="font-display text-3xl text-maive-camel">
            {product.name.charAt(0)}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-body text-sm font-medium text-maive-noir truncate">
          {product.name}
        </h3>
        
        {/* Price */}
        <p className="font-display text-lg text-maive-camel mt-1">
          {formatDZD(getPrice())}
        </p>

        {/* Color Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  selectedVariant?.id === variant.id
                    ? 'border-maive-camel scale-110'
                    : 'border-transparent hover:border-maive-camel-light'
                }`}
                style={{ backgroundColor: variant.colorHex || '#ccc' }}
                title={`${variant.color} (${variant.stockQty})`}
              />
            ))}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full mt-3 py-2 rounded-maive-sm font-body text-sm font-medium transition-all ${
            isOutOfStock
              ? 'bg-maive-parchment text-maive-muted cursor-not-allowed'
              : 'bg-maive-camel text-white hover:bg-maive-camel-dark hover:shadow-maive-gold'
          }`}
        >
          {isOutOfStock ? t('pos.product.outOfStock') : t('pos.product.addToCart')}
        </button>
      </div>
    </div>
  );
}
