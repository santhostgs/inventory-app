import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import { formatCurrency, calculateInvoiceTotal } from '../../lib/helpers'
import { validateInvoiceForm } from '../../lib/validation'
import { useToast, Toast } from '../../components/Toast'
import { FormSelect, FormInput } from '../../components/FormInput'
import { LoadingSpinner } from '../../components/Loading'

export default function CreateInvoice() {
  const router = useRouter()
  const { toast, show } = useToast()

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [items, setItems] = useState([
    { product_id: '', qty: 1, price: 0 }
  ])

  const [taxRate, setTaxRate] = useState(18) // GST default 18%
  const [discountAmount, setDiscountAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: cust } = await supabase.from('customers').select('*')
      const { data: prod } = await supabase.from('products').select('*')

      setCustomers(cust || [])
      setProducts(prod || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      show.error('Failed to load customers and products')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (i, field, value) => {
    const updated = [...items]
    updated[i][field] = value

    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) updated[i].price = product.price
    }

    setItems(updated)
    if (errors.items) {
      setErrors({ ...errors, items: null })
    }
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    setItems([...items, { product_id: '', qty: 1, price: 0 }])
  }

  const { subtotal, taxAmount, total } = calculateInvoiceTotal(items, taxRate, discountAmount)

  const saveInvoice = async () => {
    const validationErrors = validateInvoiceForm({ customer_id: selectedCustomer, items })
    if (validationErrors) {
      setErrors(validationErrors)
      show.error('Please fix the errors below')
      return
    }

    try {
      setLoading(true)

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([{
          customer_id: selectedCustomer,
          total,
          tax_amount: taxAmount,
          tax_rate: taxRate,
          discount_amount: discountAmount,
          notes,
          payment_status: 'unpaid',
          status: 'finalized'
        }])
        .select()
        .single()

      if (error) throw error

      const itemsData = items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        line_total: item.qty * item.price
      }))

      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert(itemsData)

      if (itemError) throw itemError

      show.success('Invoice created successfully!')
      setTimeout(() => {
        router.push('/invoice')
      }, 1500)
    } catch (error) {
      console.error('Error saving invoice:', error)
      show.error(error.message || 'Failed to save invoice')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <p className="text-gray-600 mt-1">Create a new invoice for your customer</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormSelect
            label="Customer"
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value)
              setErrors({ ...errors, customer_id: null })
            }}
            options={customers}
            required
            error={errors.customer_id}
            placeholder="Select a customer..."
          />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Invoice Items</h2>

          {errors.items && typeof errors.items === 'string' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errors.items}
            </div>
          )}

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-center font-medium" style={{width: '80px'}}>Qty</th>
                  <th className="px-4 py-3 text-right font-medium" style={{width: '120px'}}>Price</th>
                  <th className="px-4 py-3 text-right font-medium" style={{width: '120px'}}>Total</th>
                  <th className="px-4 py-3 text-center font-medium" style={{width: '60px'}}>Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleChange(i, 'product_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.items?.[i] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.price)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleChange(i, 'qty', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.price)}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.qty * item.price)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeItem(i)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addItem}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-6"
          >
            + Add Item
          </button>
        </div>

        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Default: 18% (GST)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this invoice..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t mt-6 pt-6">
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({taxRate}%):</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-semibold">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveInvoice}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Saving...' : 'Create Invoice'}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => {}} />}
    </div>
  )
}