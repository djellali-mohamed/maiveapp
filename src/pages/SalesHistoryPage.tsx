import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDZD } from '../utils/currency';
import { useUIStore } from '../store/ui.store';

interface Transaction {
  id: number;
  ref: string;
  created_at: string;
  customer_name?: string;
  cashier_name?: string;
  total: number;
  payment_method: string;
  status: string;
  item_count: number;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  completed: { label: 'sales.statuses.completed', className: 'bg-green-100 text-green-800' },
  refunded: { label: 'sales.statuses.refunded', className: 'bg-red-100 text-red-800' },
  partial_refund: { label: 'sales.statuses.partial_refund', className: 'bg-amber-100 text-amber-800' },
  voided: { label: 'sales.statuses.voided', className: 'bg-gray-100 text-gray-800' },
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'checkout.cash',
  card: 'checkout.card',
  mobile: 'checkout.mobile',
};

export function SalesHistoryPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const { addToast } = useUIStore();

  useEffect(() => {
    loadTransactions();
  }, [dateFilter]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      const today = new Date().toISOString().slice(0, 10);

      switch (dateFilter) {
        case 'today':
          startDate = today;
          endDate = today;
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().slice(0, 10);
          endDate = today;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = monthAgo.toISOString().slice(0, 10);
          endDate = today;
          break;
      }

      const data = await window.electronAPI.getTransactions({ startDate, endDate });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      addToast('Erreur lors du chargement des ventes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ref.toLowerCase().includes(query) ||
          t.customer_name?.toLowerCase().includes(query)
      );
    }
    setFilteredTransactions(filtered);
  };

  const handleViewTransaction = async (transaction: Transaction) => {
    try {
      const detail = await window.electronAPI.getTransaction(transaction.id);
      setSelectedTransaction(detail);
      setShowTransactionDetail(true);
    } catch (error) {
      addToast('Erreur lors du chargement des détails', 'error');
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason) return;

    try {
      await window.electronAPI.refundTransaction(selectedTransaction.id, refundReason);
      addToast('Remboursement effectué', 'success');
      setShowRefundModal(false);
      setShowTransactionDetail(false);
      loadTransactions();
    } catch (error) {
      addToast('Erreur lors du remboursement', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-DZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-maive-noir">
          {t('sales.title')}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-4 py-2 rounded-maive-sm font-body text-sm transition-all ${
                dateFilter === filter
                  ? 'bg-maive-camel text-white'
                  : 'bg-maive-cream text-maive-charcoal hover:bg-maive-parchment'
              }`}
            >
              {t(`sales.filters.${filter}`)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maive-muted" />
          <Input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto bg-maive-warm-white rounded-maive-md border border-maive-parchment">
        <Table>
          <TableHeader>
            <TableRow className="border-maive-parchment">
              <TableHead className="font-body text-maive-muted">{t('sales.reference')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('sales.date')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('sales.customer')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('sales.total')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('sales.paymentMethod')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('sales.status')}</TableHead>
              <TableHead className="font-body text-maive-muted">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="animate-pulse font-body text-maive-muted">{t('common.loading')}</div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-maive-muted font-body">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => {
                const status = statusLabels[transaction.status] || statusLabels.completed;
                return (
                  <TableRow key={transaction.id} className="border-maive-parchment">
                    <TableCell className="font-mono text-sm">{transaction.ref}</TableCell>
                    <TableCell className="font-body text-sm">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {transaction.customer_name || '-'}
                    </TableCell>
                    <TableCell className="font-display text-maive-camel">
                      {formatDZD(transaction.total)}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {t(paymentMethodLabels[transaction.payment_method])}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-maive-xs text-xs font-body ${status.className}`}>
                        {t(status.label)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTransaction(transaction)}
                          className="text-maive-camel hover:text-maive-camel-dark"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {transaction.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowRefundModal(true);
                            }}
                            className="text-maive-danger hover:text-maive-danger/80"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Transaction Detail Modal */}
      <Dialog open={showTransactionDetail} onOpenChange={setShowTransactionDetail}>
        <DialogContent className="sm:max-w-lg bg-maive-warm-white border-maive-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-maive-noir">
              {t('sales.transaction')} {selectedTransaction?.ref}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Affichage des détails de la transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-maive-muted">{t('sales.date')}</span>
                  <p className="font-body">{formatDate(selectedTransaction.created_at)}</p>
                </div>
                <div>
                  <span className="text-maive-muted">{t('sales.status')}</span>
                  <p className="font-body">{selectedTransaction.status}</p>
                </div>
                <div>
                  <span className="text-maive-muted">{t('sales.customer')}</span>
                  <p className="font-body">{selectedTransaction.customer_name || '-'}</p>
                </div>
                <div>
                  <span className="text-maive-muted">Caissier</span>
                  <p className="font-body">{selectedTransaction.cashier_name || '-'}</p>
                </div>
              </div>

              <div className="border-t border-maive-parchment pt-4">
                <h4 className="font-body font-medium mb-2">Articles</h4>
                <div className="space-y-2">
                  {selectedTransaction.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-body">
                        {item.product_name}
                        {item.variant_label && <span className="text-maive-muted"> - {item.variant_label}</span>}
                        <span className="text-maive-muted"> x{item.quantity}</span>
                      </span>
                      <span className="font-display">{formatDZD(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-maive-parchment pt-4">
                <div className="flex justify-between">
                  <span className="font-body text-maive-muted">Sous-total</span>
                  <span className="font-display">{formatDZD(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-body text-maive-muted">Remise</span>
                    <span className="font-display text-maive-camel">
                      -{formatDZD(selectedTransaction.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between mt-2 pt-2 border-t border-maive-parchment">
                  <span className="font-body font-medium">TOTAL</span>
                  <span className="font-display text-xl text-maive-camel">
                    {formatDZD(selectedTransaction.total)}
                  </span>
                </div>
              </div>

              {selectedTransaction.status === 'completed' && (
                <Button
                  onClick={() => setShowRefundModal(true)}
                  variant="outline"
                  className="w-full border-maive-danger text-maive-danger hover:bg-maive-danger hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('sales.refund.title')}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="sm:max-w-md bg-maive-warm-white border-maive-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-maive-noir">
              {t('sales.refund.title')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirmer l'opération de remboursement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-body text-sm text-maive-muted">
                {t('sales.refund.reason')}
              </label>
              <Input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1"
                placeholder="Motif du remboursement..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRefundModal(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleRefund}
                disabled={!refundReason}
                className="flex-1 bg-maive-danger hover:bg-maive-danger/90 text-white"
              >
                {t('sales.refund.confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
