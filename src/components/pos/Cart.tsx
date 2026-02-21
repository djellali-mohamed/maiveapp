import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Minus, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  User, 
  Tag,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDZD } from '../../utils/currency';
import { useCartStore, CartItem } from '../../store/cart.store';
import { useUIStore } from '../../store/ui.store';

interface CartProps {
  onCheckout: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const { t } = useTranslation();
  const {
    items,
    discountAmount,
    discountReason,
    discountType,
    customerName,
    removeItem,
    updateQuantity,
    updatePrice,
    setDiscount,
    clearCart,
    getSubtotal,
    getTotal,
    getItemCount,
  } = useCartStore();

  const { addToast } = useUIStore();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [discountTypeLocal, setDiscountTypeLocal] = useState<'percentage' | 'fixed'>('fixed');
  const [discountReasonLocal, setDiscountReasonLocal] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault();
      if (items.length > 0) {
        setShowClearConfirm(true);
      }
    }
  };

  // Add keyboard listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  const handleUpdatePrice = () => {
    if (editingItem && newPrice && priceReason) {
      const priceInCentimes = Math.round(parseFloat(newPrice) * 100);
      updatePrice(editingItem.id, priceInCentimes, priceReason);
      addToast('Prix mis à jour', 'success');
      setEditingItem(null);
      setNewPrice('');
      setPriceReason('');
    }
  };

  const handleAddDiscount = () => {
    const amount = parseFloat(discountValue);
    if (amount > 0) {
      const discountInCentimes = discountTypeLocal === 'fixed' 
        ? Math.round(amount * 100) 
        : amount;
      setDiscount(discountInCentimes, discountTypeLocal, discountReasonLocal);
      addToast('Remise appliquée', 'success');
      setShowDiscountModal(false);
      setDiscountValue('');
      setDiscountReasonLocal('');
    }
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    addToast('Panier vidé', 'info');
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col bg-maive-warm-white border-l border-maive-parchment">
        <div className="p-4 border-b border-maive-parchment">
          <h2 className="font-display text-xl text-maive-noir">
            {t('pos.cart.title')}
          </h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-maive-parchment mb-4" />
          <p className="font-body text-maive-muted italic">
            {t('pos.cart.empty')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-maive-warm-white border-l border-maive-parchment">
      {/* Header */}
      <div className="p-4 border-b border-maive-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-maive-noir">
            {t('pos.cart.title')}
          </h2>
          <span className="font-body text-sm text-maive-muted">
            {itemCount} {itemCount === 1 ? t('pos.cart.itemCount') : t('pos.cart.itemCount_plural', { count: itemCount })}
          </span>
        </div>
        {customerName && (
          <div className="flex items-center gap-2 mt-2 text-sm text-maive-camel">
            <User className="w-4 h-4" />
            <span className="font-body">{customerName}</span>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-maive-cream rounded-maive-sm border border-maive-parchment"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-body text-sm font-medium text-maive-noir truncate">
                  {item.name}
                </h3>
                {item.variantLabel && (
                  <p className="text-xs text-maive-muted font-body">
                    {item.variantLabel}
                  </p>
                )}
                {item.unitPrice !== item.originalPrice && (
                  <p className="text-xs text-maive-camel font-body">
                    {t('pos.cart.negotiatedPrice')}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-maive-muted hover:text-maive-danger transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-maive-xs bg-maive-warm-white border border-maive-parchment hover:border-maive-camel transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-body text-sm w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-maive-xs bg-maive-warm-white border border-maive-parchment hover:border-maive-camel transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Price & Edit */}
              <div className="flex items-center gap-2">
                <span className="font-display text-sm text-maive-noir">
                  {formatDZD(item.unitPrice * item.quantity)}
                </span>
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setNewPrice((item.unitPrice / 100).toString());
                  }}
                  className="p-1 text-maive-muted hover:text-maive-camel transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-maive-parchment bg-maive-cream/50">
        {/* Subtotal */}
        <div className="flex justify-between mb-2">
          <span className="font-body text-sm text-maive-muted">
            {t('pos.cart.subtotal')}
          </span>
          <span className="font-body text-sm text-maive-noir">
            {formatDZD(subtotal)}
          </span>
        </div>

        {/* Discount */}
        {discountAmount > 0 && (
          <div className="flex justify-between mb-2">
            <span className="font-body text-sm text-maive-muted flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {t('pos.cart.discount')}
              {discountReason && ` (${discountReason})`}
            </span>
            <span className="font-body text-sm text-maive-camel">
              -{formatDZD(discountType === 'percentage' ? subtotal * (discountAmount / 100) : discountAmount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between pt-3 border-t border-maive-parchment mb-4">
          <span className="font-display text-lg text-maive-noir">
            {t('pos.cart.total')}
          </span>
          <span className="font-display text-2xl text-maive-camel">
            {formatDZD(total)}
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            className="col-span-1 border-maive-parchment text-maive-muted hover:bg-maive-danger hover:text-white hover:border-maive-danger"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDiscountModal(true)}
            className="col-span-1 border-maive-parchment text-maive-camel hover:bg-maive-camel hover:text-white"
          >
            <Tag className="w-4 h-4" />
          </Button>
          <Button
            onClick={onCheckout}
            className="col-span-2 bg-maive-camel hover:bg-maive-camel-dark text-white font-body"
          >
            {t('pos.cart.checkout')}
          </Button>
        </div>
      </div>

      {/* Edit Price Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-maive-warm-white border-maive-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-maive-noir">
              {t('pos.cart.negotiatedPrice')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Modifier le prix de l'article après négociation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-body text-sm text-maive-muted">
                Nouveau prix (DZD)
              </label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="font-body text-sm text-maive-muted">
                {t('pos.cart.reasonRequired')}
              </label>
              <Input
                type="text"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                className="mt-1"
                placeholder="Ex: Client fidèle"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpdatePrice}
                disabled={!newPrice || !priceReason}
                className="flex-1 bg-maive-camel hover:bg-maive-camel-dark text-white"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Modal */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="bg-maive-warm-white border-maive-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-maive-noir">
              {t('pos.cart.addDiscount')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Appliquer une remise sur le total de la commande.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountTypeLocal('fixed')}
                className={`flex-1 py-2 rounded-maive-sm font-body text-sm ${
                  discountTypeLocal === 'fixed'
                    ? 'bg-maive-camel text-white'
                    : 'bg-maive-cream text-maive-charcoal'
                }`}
              >
                DZD
              </button>
              <button
                onClick={() => setDiscountTypeLocal('percentage')}
                className={`flex-1 py-2 rounded-maive-sm font-body text-sm ${
                  discountTypeLocal === 'percentage'
                    ? 'bg-maive-camel text-white'
                    : 'bg-maive-cream text-maive-charcoal'
                }`}
              >
                %
              </button>
            </div>
            <div>
              <label className="font-body text-sm text-maive-muted">
                Montant
              </label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="font-body text-sm text-maive-muted">
                Motif (optionnel)
              </label>
              <Input
                type="text"
                value={discountReasonLocal}
                onChange={(e) => setDiscountReasonLocal(e.target.value)}
                className="mt-1"
                placeholder="Ex: Promotion"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDiscountModal(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAddDiscount}
                disabled={!discountValue}
                className="flex-1 bg-maive-camel hover:bg-maive-camel-dark text-white"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Confirm Modal */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-maive-warm-white border-maive-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-maive-noir">
              {t('pos.cart.clearConfirm')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Êtes-vous sûr de vouloir vider le panier ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1"
            >
              {t('common.no')}
            </Button>
            <Button
              onClick={handleClearCart}
              className="flex-1 bg-maive-danger hover:bg-maive-danger/90 text-white"
            >
              {t('common.yes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
