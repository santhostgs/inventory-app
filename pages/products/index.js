import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getStatusBadgeColor, truncate } from '../../lib/helpers';
import { FormInput, FormSelect } from '../../components/FormInput';
import { useToast } from '../../components/Toast';
import { Toast } from '../../components/Toast';
import { TableLoadingSkeleton } from '../../components/Loading';

export default function ProductsList() {
  const router = useRouter();
  const { toast, show } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter, categoryFilter, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('product_categories').select('id, name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      show.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category_id === categoryFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      // First check if product has any invoice items
      const { data: invoiceItems, error: checkError } = await supabase
        .from('invoice_items')
        .select('id', { count: 'exact' })
        .eq('product_id', id);

      if (!checkError && invoiceItems && invoiceItems.length > 0) {
        show.error(`Cannot delete product. It has ${invoiceItems.length} invoice item(s). Please remove from invoices first.`);
        return;
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      show.success('Product deleted successfully');
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      show.error(error.message || 'Failed to delete product');
    }
  };

  const getStockStatusColor = (stock, threshold) => {
    if (stock <= (threshold || 10)) return 'text-red-600';
    if (stock <= (threshold || 10) * 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage your product inventory</p>
          </div>
          <button
            onClick={() => router.push('/products/create')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition"
          >
            + Add Product
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <FormInput
              placeholder="Search by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FormSelect
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
              ]}
            />
            <FormSelect
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categories}
            />
            <FormSelect
              placeholder="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { id: 'name', label: 'Name' },
                { id: 'price', label: 'Price (High to Low)' },
                { id: 'stock', label: 'Stock (High to Low)' },
                { id: 'recent', label: 'Recently Added' },
              ]}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <TableLoadingSkeleton rows={5} columns={6} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {products.length === 0 ? 'No products yet' : 'No products match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SKU</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stock</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {product.image_url && (
                            <img src={product.image_url} alt={product.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">{truncate(product.description, 30)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{product.sku || '-'}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                        <span className={`text-xs sm:text-sm font-medium ${getStockStatusColor(product.stock, product.low_stock_threshold)}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(product.status)}`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex gap-1 sm:gap-2">
                          <button onClick={() => router.push(`/products/${product.id}`)} className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && products.length > 0 && (
          <p className="mt-4 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => {}} />
      )}
    </div>
  );
}