import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/helpers';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalInvoices: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    loading: true,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Get all invoices for sales and pending amounts
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total, payment_status');

      // Get all products for count and low stock
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, stock, low_stock_threshold');

      if (invoicesError) throw invoicesError;
      if (productsError) throw productsError;

      // Calculate metrics
      const totalSales = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const totalInvoices = invoices?.length || 0;
      const totalProducts = products?.length || 0;
      
      const lowStockCount = products?.filter(p => 
        p.stock <= (p.low_stock_threshold || 10)
      ).length || 0;

      const paidAmount = invoices?.filter(inv => inv.payment_status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      const pendingAmount = invoices?.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial')
        .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      setMetrics({
        totalSales,
        totalInvoices,
        totalProducts,
        lowStockCount,
        pendingAmount,
        paidAmount,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  if (metrics.loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Business metrics at a glance</p>
        </div>

        {/* Main Metrics - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {/* Total Sales Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">Total Sales</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2 break-words">
                  {formatCurrency(metrics.totalSales)}
                </h2>
                <p className="text-gray-400 text-xs mt-1">All time</p>
              </div>
              <div className="text-2xl sm:text-3xl text-blue-500 flex-shrink-0">₹</div>
            </div>
          </div>

          {/* Total Invoices Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">Total Invoices</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                  {metrics.totalInvoices}
                </h2>
                <p className="text-gray-400 text-xs mt-1">Created</p>
              </div>
              <div className="text-2xl sm:text-3xl flex-shrink-0">📄</div>
            </div>
          </div>

          {/* Total Products Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">Total Products</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                  {metrics.totalProducts}
                </h2>
                <p className="text-gray-400 text-xs mt-1">In catalog</p>
              </div>
              <div className="text-2xl sm:text-3xl flex-shrink-0">📦</div>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">Low Stock Items</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                  {metrics.lowStockCount}
                </h2>
                <p className="text-gray-400 text-xs mt-1">Needs reorder</p>
              </div>
              <div className="text-2xl sm:text-3xl flex-shrink-0">⚠️</div>
            </div>
          </div>
        </div>

        {/* Payment Status Cards - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {/* Paid Amount Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Paid Amount</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 sm:mt-3 break-words">
              {formatCurrency(metrics.paidAmount)}
            </h2>
            <p className="text-emerald-600 text-xs mt-2">✓ Completed payments</p>
          </div>

          {/* Pending Amount Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Pending Amount</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 sm:mt-3 break-words">
              {formatCurrency(metrics.pendingAmount)}
            </h2>
            <p className="text-orange-600 text-xs mt-2">⏳ Awaiting payment</p>
          </div>
        </div>

        {/* Quick Stats - Mobile First */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Quick Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Average Invoice */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Average Invoice</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1 break-words">
                  {metrics.totalInvoices > 0 
                    ? formatCurrency(metrics.totalSales / metrics.totalInvoices)
                    : '₹0'
                  }
                </p>
              </div>
            </div>

            {/* Collection Rate */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">📊</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Collection Rate</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                  {metrics.totalSales > 0 
                    ? ((metrics.paidAmount / metrics.totalSales) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
            </div>

            {/* In-Stock Rate */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">In-Stock Rate</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                  {metrics.totalProducts > 0 
                    ? (((metrics.totalProducts - metrics.lowStockCount) / metrics.totalProducts) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}