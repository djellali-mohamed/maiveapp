import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, CreditCard, Smartphone, Check, ArrowLeft, User, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDZD, calculateChange } from '../../utils/currency';
import { useCartStore } from '../../store/cart.store';
import { useSessionStore } from '../../store/session.store';
import { useUIStore } from '../../store/ui.store';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transaction: any) => void;
}

type PaymentMethod = 'cash' | 'card' | 'mobile';
type CheckoutStep = 'payment' | 'details' | 'success';

const quickAmounts = [500, 1000, 2000, 5000, 10000];

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { t } = useTranslation();
  const { items, discountAmount, discountReason, discountType, customerId, customerName, notes, getSubtotal, getTotal, clearCart } = useCartStore();
  const { cashier, drawerSession } = useSessionStore();
  const { addToast } = useUIStore();

  const [step, setStep] = useState<CheckoutStep>('payment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const total = getTotal();
  const subtotal = getSubtotal();
  const change = amountTendered ? calculateChange(Math.round(parseFloat(amountTendered) * 100), total) : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('payment');
      setPaymentMethod('cash');
      setAmountTendered('');
      setTransaction(null);
      setSelectedCustomer(customerId ? { id: customerId, name: customerName } : null);
    }
  }, [isOpen, customerId, customerName]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'success') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, onClose]);

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setFoundCustomers([]);
      return;
    }
    try {
      const results = await window.electronAPI.searchCustomers(query);
      setFoundCustomers(results);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountTendered(amount.toString());
  };

  const handleExactAmount = () => {
    setAmountTendered((total / 100).toString());
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash' && (!amountTendered || parseFloat(amountTendered) * 100 < total)) {
      addToast('Montant insuffisant', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Check if drawer is open for cash payments
      if (paymentMethod === 'cash' && !drawerSession) {
        // Auto-open drawer with 0 float for simplicity
        await window.electronAPI.openDrawer(cashier?.id || 1, 0);
      }

      const transactionData = {
        subtotal,
        discountAmount: discountType === 'percentage' ? Math.round(subtotal * (discountAmount / 100)) : discountAmount,
        discountReason,
        total,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? Math.round(parseFloat(amountTendered) * 100) : total,
        changeGiven: paymentMethod === 'cash' ? change : 0,
        cashierId: cashier?.id,
        customerId: selectedCustomer?.id,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.name,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originalPrice: item.originalPrice,
          lineTotal: item.unitPrice * item.quantity,
        })),
      };

      const result = await window.electronAPI.createTransaction(transactionData);
      setTransaction(result);
      setStep('success');
      onSuccess(result);
    } catch (error) {
      console.error('Payment failed:', error);
      addToast('Erreur lors du paiement', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (transaction) {
      try {
        await window.electronAPI.printReceipt(transaction.id);
        addToast('Reçu imprimé', 'success');
      } catch (error) {
        addToast('Erreur d\'impression', 'error');
      }
    }
  };

  const handleNewSale = () => {
    clearCart();
    onClose();
  };

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="font-body text-sm text-maive-muted mb-2">
          {t('checkout.total')}
        </p>
        <p className="font-display text-4xl text-maive-camel">
          {formatDZD(total)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setPaymentMethod('cash')}
          className={`p-4 rounded-maive-md border-2 transition-all ${
            paymentMethod === 'cash'
              ? 'border-maive-camel bg-maive-cream'
              : 'border-maive-parchment hover:border-maive-camel-light'
          }`}
        >
          <Banknote className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'cash' ? 'text-maive-camel' : 'text-maive-muted'}`} />
          <span className="font-body text-sm">{t('checkout.cash')}</span>
        </button>

        <button
          onClick={() => setPaymentMethod('card')}
          className={`p-4 rounded-maive-md border-2 transition-all ${
            paymentMethod === 'card'
              ? 'border-maive-camel bg-maive-cream'
              : 'border-maive-parchment hover:border-maive-camel-light'
          }`}
        >
          <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-maive-camel' : 'text-maive-muted'}`} />
          <span className="font-body text-sm">{t('checkout.card')}</span>
        </button>

        <button
          onClick={() => setPaymentMethod('mobile')}
          className={`p-4 rounded-maive-md border-2 transition-all ${
            paymentMethod === 'mobile'
              ? 'border-maive-camel bg-maive-cream'
              : 'border-maive-parchment hover:border-maive-camel-light'
          }`}
        >
          <Smartphone className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'mobile' ? 'text-maive-camel' : 'text-maive-muted'}`} />
          <span className="font-body text-sm">{t('checkout.mobile')}</span>
        </button>
      </div>

      <Button
        onClick={() => setStep('details')}
        className="w-full h-12 bg-maive-camel hover:bg-maive-camel-dark text-white font-body"
      >
        {t('common.next')}
      </Button>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <button
        onClick={() => setStep('payment')}
        className="flex items-center gap-2 text-maive-muted hover:text-maive-camel transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-body text-sm">{t('common.back')}</span>
      </button>

      <div className="text-center">
        <p className="font-display text-3xl text-maive-camel">
          {formatDZD(total)}
        </p>
        <p className="font-body text-sm text-maive-muted mt-1">
          {t(`checkout.${paymentMethod}`)}
        </p>
      </div>

      {paymentMethod === 'cash' && (
        <>
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className="py-2 px-3 bg-maive-cream rounded-maive-sm font-body text-sm hover:bg-maive-parchment transition-colors"
              >
                {amount.toLocaleString('fr-DZ')}
              </button>
            ))}
            <button
              onClick={handleExactAmount}
              className="py-2 px-3 bg-maive-camel text-white rounded-maive-sm font-body text-sm hover:bg-maive-camel-dark transition-colors"
            >
              {t('checkout.quickAmounts.exact')}
            </button>
          </div>

          {/* Amount Tendered Input */}
          <div>
            <label className="font-body text-sm text-maive-muted">
              {t('checkout.amountTendered')}
            </label>
            <Input
              type="number"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              className="mt-1 text-lg"
              autoFocus
              placeholder="0"
            />
          </div>

          {/* Change Display */}
          {amountTendered && change > 0 && (
            <div className="p-4 bg-green-50 rounded-maive-md">
              <p className="font-body text-sm text-green-700">
                {t('checkout.change')}
              </p>
              <p className="font-display text-2xl text-green-700">
                {formatDZD(change)}
              </p>
            </div>
          )}
        </>
      )}

      {/* Customer Selection */}
      <div>
        <label className="font-body text-sm text-maive-muted flex items-center gap-2">
          <User className="w-4 h-4" />
          Client (optionnel)
        </label>
        {selectedCustomer ? (
          <div className="mt-2 flex items-center justify-between p-3 bg-maive-cream rounded-maive-sm">
            <span className="font-body text-sm">{selectedCustomer.name}</span>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-maive-muted hover:text-maive-danger"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <Input
              type="text"
              value={customerSearchQuery}
              onChange={(e) => {
                setCustomerSearchQuery(e.target.value);
                searchCustomers(e.target.value);
              }}
              placeholder="Rechercher un client..."
            />
            {foundCustomers.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-maive-parchment rounded-maive-sm">
                {foundCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearchQuery('');
                      setFoundCustomers([]);
                    }}
                    className="w-full px-3 py-2 text-left font-body text-sm hover:bg-maive-cream"
                  >
                    {customer.name}
                    {customer.phone && <span className="text-maive-muted ml-2">({customer.phone})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleConfirmPayment}
        disabled={isProcessing || (paymentMethod === 'cash' && (!amountTendered || parseFloat(amountTendered) * 100 < total))}
        className="w-full h-12 bg-maive-camel hover:bg-maive-camel-dark text-white font-body"
      >
        {isProcessing ? '...' : t('checkout.confirm')}
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h3 className="font-display text-2xl text-maive-noir">
          {t('checkout.success.title')}
        </h3>
        <p className="font-body text-maive-muted mt-1">
          {t('checkout.success.message')}
        </p>
      </div>

      {transaction && (
        <div className="p-4 bg-maive-cream rounded-maive-md">
          <p className="font-body text-sm text-maive-muted">
            Référence
          </p>
          <p className="font-display text-xl text-maive-camel">
            {transaction.ref}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handlePrintReceipt}
          className="border-maive-camel text-maive-camel hover:bg-maive-camel hover:text-white"
        >
          {t('checkout.success.printReceipt')}
        </Button>
        <Button
          onClick={handleNewSale}
          className="bg-maive-camel hover:bg-maive-camel-dark text-white"
        >
          {t('checkout.success.newSale')}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-maive-warm-white border-maive-parchment">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-maive-noir text-center">
            {step === 'success' ? '' : t('checkout.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configuration du paiement et finalisation de la transaction.
          </DialogDescription>
        </DialogHeader>

        {step === 'payment' && renderPaymentStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}
