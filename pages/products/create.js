import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { validateProductForm } from '../../lib/validation';
import { FormInput, FormSelect, FormTextarea } from '../../components/FormInput';
import { useToast } from '../../components/Toast';
import { Toast } from '../../components/Toast';

export default function CreateProduct() {
  const router = useRouter();
  const { toast, show } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost_price: '',
    stock: '',
    category_id: '',
    image_url: '',
    status: 'active',
    low_stock_threshold: '10',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('product_categories').select('id, name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      show.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateProductForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from('products').insert([
        {
          ...formData,
          category_id: formData.category_id || null,
          price: parseFloat(formData.price),
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          stock: parseInt(formData.stock),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
        }
      ]);

      if (error) throw error;
      show.success('Product created successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      show.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Product</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Add a new product to your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <FormInput
              label="Product Name"
              name="name"
              placeholder="e.g., Wireless Mouse"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <FormInput
              label="SKU"
              name="sku"
              placeholder="e.g., MOUSE-001"
              value={formData.sku}
              onChange={handleChange}
              error={errors.sku}
            />

            <FormInput
              label="Price"
              name="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              required
            />

            <FormInput
              label="Cost Price"
              name="cost_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.cost_price}
              onChange={handleChange}
              error={errors.cost_price}
            />

            <FormInput
              label="Stock Quantity"
              name="stock"
              type="number"
              placeholder="0"
              value={formData.stock}
              onChange={handleChange}
              error={errors.stock}
              required
            />

            <FormInput
              label="Low Stock Threshold"
              name="low_stock_threshold"
              type="number"
              placeholder="10"
              value={formData.low_stock_threshold}
              onChange={handleChange}
            />

            <FormSelect
              label="Category"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              options={categories}
              placeholder="Select a category"
            />

            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
              ]}
            />

            <FormInput
              label="Image URL"
              name="image_url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={handleChange}
              className="md:col-span-2"
            />
          </div>

          <FormTextarea
            label="Description"
            name="description"
            placeholder="Product description..."
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
          />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition text-sm sm:text-base"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => {}} />
      )}
    </div>
  );
}