import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDZD } from '../utils/currency';
import { useUIStore } from '../store/ui.store';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  basePrice: number;
  total_stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}

const categoryLabels: Record<string, string> = {
  totes: 'Totes',
  mini_bags: 'Mini Bags',
  pochettes: 'Pochettes',
  epaule: 'Épaule',
  bandouliere: 'Bandoulière',
  soiree: 'Soirée',
};

export function InventoryPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { addToast } = useUIStore();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      addToast('Erreur lors du chargement des produits', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
    }
    setFilteredProducts(filtered);
  };

  const getStockStatus = (product: Product) => {
    if (product.total_stock <= 0) {
      return { label: t('inventory.outOfStock'), className: 'bg-red-100 text-red-800' };
    }
    if (product.total_stock <= product.lowStockThreshold) {
      return { label: t('inventory.lowStock'), className: 'bg-amber-100 text-amber-800' };
    }
    return { label: t('inventory.inStock'), className: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-maive-noir">
          {t('inventory.title')}
        </h1>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          className="bg-maive-camel hover:bg-maive-camel-dark text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('inventory.addProduct')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maive-muted" />
        <Input
          type="text"
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-auto bg-maive-warm-white rounded-maive-md border border-maive-parchment">
        <Table>
          <TableHeader>
            <TableRow className="border-maive-parchment">
              <TableHead className="font-body text-maive-muted">{t('inventory.sku')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('inventory.name')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('inventory.category')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('inventory.price')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('inventory.stock')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="animate-pulse font-body text-maive-muted">{t('common.loading')}</div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-maive-muted font-body">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow key={product.id} className="border-maive-parchment">
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-body font-medium">{product.name}</TableCell>
                    <TableCell className="font-body text-sm">
                      {categoryLabels[product.category] || product.category}
                    </TableCell>
                    <TableCell className="font-display text-maive-camel">
                      {formatDZD(product.basePrice)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-maive-xs text-xs font-body ${stockStatus.className}`}>
                        {product.total_stock} - {stockStatus.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductForm(true);
                        }}
                        className="text-maive-camel hover:text-maive-camel-dark"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Form Modal - Simplified */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="sm:max-w-lg bg-maive-warm-white border-maive-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-maive-noir">
              {editingProduct ? t('inventory.editProduct') : t('inventory.addProduct')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingProduct ? "Modifier les informations du produit." : "Ajouter un nouveau produit à l'inventaire."}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-maive-muted font-body">
            <Package className="w-12 h-12 mx-auto mb-3 text-maive-parchment" />
            <p>Formulaire de produit à implémenter</p>
            <p className="text-sm mt-2">Cette fonctionnalité permettra d'ajouter/modifier les produits et leurs variantes.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
