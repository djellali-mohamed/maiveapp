import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ShoppingCart, Package, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDZD } from '../utils/currency';
import { useUIStore } from '../store/ui.store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DailySummary {
  date: string;
  revenue: number;
  transactionCount: number;
  averageBasket: number;
  paymentMethods: { payment_method: string; total: number; count: number }[];
  totalDiscounts: number;
  itemsSold: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

const COLORS = ['#C4956A', '#BFA16B', '#D4B98A', '#E8D4B8', '#A67848'];

export function ReportsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUIStore();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // Load daily summary
      const summaryData = await window.electronAPI.getDailySummary();
      setSummary(summaryData);

      // Load top products
      const topProductsData = await window.electronAPI.getTopProducts(5);
      setTopProducts(topProductsData);

      // Load 14-day sales data
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 13);
      const salesReport = await window.electronAPI.getSalesReport(
        startDate.toISOString().slice(0, 10),
        endDate
      );
      setSalesData(salesReport.dailyBreakdown || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
      addToast('Erreur lors du chargement des rapports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-maive-noir">
          {t('reports.title')}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse font-body text-maive-muted">{t('common.loading')}</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-maive-warm-white border-maive-parchment">
              <CardHeader className="pb-2">
                <CardTitle className="font-body text-sm text-maive-muted flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('reports.revenue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl text-maive-camel">
                  {formatDZD(summary?.revenue || 0)}
                </p>
                <p className="font-body text-xs text-maive-muted mt-1">
                  Aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card className="bg-maive-warm-white border-maive-parchment">
              <CardHeader className="pb-2">
                <CardTitle className="font-body text-sm text-maive-muted flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {t('reports.transactions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl text-maive-noir">
                  {summary?.transactionCount || 0}
                </p>
                <p className="font-body text-xs text-maive-muted mt-1">
                  Aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card className="bg-maive-warm-white border-maive-parchment">
              <CardHeader className="pb-2">
                <CardTitle className="font-body text-sm text-maive-muted flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t('reports.avgBasket')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl text-maive-noir">
                  {formatDZD(summary?.averageBasket || 0)}
                </p>
                <p className="font-body text-xs text-maive-muted mt-1">
                  Aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card className="bg-maive-warm-white border-maive-parchment">
              <CardHeader className="pb-2">
                <CardTitle className="font-body text-sm text-maive-muted flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Articles vendus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl text-maive-noir">
                  {summary?.itemsSold || 0}
                </p>
                <p className="font-body text-xs text-maive-muted mt-1">
                  Aujourd'hui
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card className="bg-maive-warm-white border-maive-parchment">
              <CardHeader>
                <CardTitle className="font-display text-lg text-maive-noir">
                  {t('reports.salesChart')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D4" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatChartDate}
                        tick={{ fontSize: 12, fill: '#8A7D72' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#8A7D72' }}
                        tickFormatter={(value) => `${(value / 100000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatDZD(value)}
                        labelFormatter={(label) => formatChartDate(label as string)}
                        contentStyle={{ 
                          backgroundColor: '#FDFAF5', 
                          border: '1px solid #DDD4C4',
                          borderRadius: '4px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="#C4956A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-maive-warm-white border-maive-parchment">
              <CardHeader>
                <CardTitle className="font-display text-lg text-maive-noir">
                  {t('reports.paymentMethods')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary?.paymentMethods || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                      >
                        {(summary?.paymentMethods || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatDZD(value)}
                        contentStyle={{ 
                          backgroundColor: '#FDFAF5', 
                          border: '1px solid #DDD4C4',
                          borderRadius: '4px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {(summary?.paymentMethods || []).map((method, index) => (
                    <div key={method.payment_method} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-body text-xs text-maive-muted capitalize">
                        {method.payment_method}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="bg-maive-warm-white border-maive-parchment">
            <CardHeader>
              <CardTitle className="font-display text-lg text-maive-noir">
                {t('reports.topProducts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div 
                    key={product.product_id} 
                    className="flex items-center justify-between p-3 bg-maive-cream rounded-maive-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-maive-camel text-white rounded-full font-body text-sm">
                        {index + 1}
                      </span>
                      <span className="font-body">{product.product_name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-body text-sm text-maive-muted">
                        {product.total_quantity} vendus
                      </span>
                      <span className="font-display text-maive-camel">
                        {formatDZD(product.total_revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
