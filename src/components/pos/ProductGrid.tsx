import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProductCard } from './ProductCard';
import { useUIStore } from '../../store/ui.store';
import type { Product, Variant } from '../../types';

interface ProductGridProps {
  onAddToCart: (product: Product, variant?: Variant) => void;
}

const categories = [
  { key: 'all', label: 'pos.categories.all' },
  { key: 'totes', label: 'pos.categories.totes' },
  { key: 'mini_bags', label: 'pos.categories.mini_bags' },
  { key: 'pochettes', label: 'pos.categories.pochettes' },
  { key: 'epaule', label: 'pos.categories.epaule' },
  { key: 'bandouliere', label: 'pos.categories.bandouliere' },
  { key: 'soiree', label: 'pos.categories.soiree' },
];

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setLoading } = useUIStore();

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when category or search changes
  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setLoading('products', true);
    try {
      const data = await window.electronAPI.getProducts();
      // Load variants for each product
      const productsWithVariants: Product[] = await Promise.all(
        data.map(async (p: any) => {
          const variants = await window.electronAPI.getVariants(p.id);
          return { ...p, variants };
        })
      );
      setProducts(productsWithVariants);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
      setLoading('products', false);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.nameEn?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-maive-parchment">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maive-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={t('pos.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-maive-warm-white border-maive-parchment focus:border-maive-camel focus:ring-maive-camel/20"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 border-b border-maive-parchment overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-maive-sm font-body text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-maive-camel text-white'
                  : 'bg-maive-cream text-maive-charcoal hover:bg-maive-parchment'
              }`}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-maive-parchment/50 rounded-maive-md animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-maive-muted font-body">{t('common.noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
