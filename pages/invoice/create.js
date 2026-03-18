import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function CreateInvoice() {
  const router = useRouter()

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')

  const [items, setItems] = useState([
    { product_id: '', qty: 1, price: 0 }
  ])

  // 🔄 Fetch customers & products
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: cust } = await supabase.from('customers').select('*')
    const { data: prod } = await supabase.from('products').select('*')

    setCustomers(cust || [])
    setProducts(prod || [])
  }

  // ✏️ Handle item change
  const handleChange = (i, field, value) => {
    const updated = [...items]
    updated[i][field] = value

    // Auto price fill
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) updated[i].price = product.price
    }

    setItems(updated)
  }

  // ➕ Add row
  const addItem = () => {
    setItems([...items, { product_id: '', qty: 1, price: 0 }])
  }

  // 💰 Calculations
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  // 💾 SAVE
  const saveInvoice = async () => {

    if (!selectedCustomer) {
      alert('Select customer')
      return
    }

    // 1️⃣ Insert invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([{ customer_id: selectedCustomer, total }])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Error saving invoice')
      return
    }

    // 2️⃣ Insert items
    const itemsData = items.map(item => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price
    }))

    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert(itemsData)

    if (itemError) {
      console.error(itemError)
      alert('Error saving items')
      return
    }

    alert('Invoice saved!')
    router.push('/invoice')
    router.reload()
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Create Invoice</h1>

      {/* 👤 Customer */}
      <select
        className="input mb-4"
        onChange={(e) => setSelectedCustomer(e.target.value)}
      >
        <option value="">Select Customer</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.phone})
          </option>
        ))}
      </select>

      {/* 📦 Items */}
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                <select
                  className="input"
                  onChange={(e) =>
                    handleChange(i, 'product_id', e.target.value)
                  }
                >
                  <option>Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <input
                  type="number"
                  className="input"
                  value={item.qty}
                  onChange={(e) =>
                    handleChange(i, 'qty', Number(e.target.value))
                  }
                />
              </td>

              <td>₹{item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addItem} className="text-blue-600 mb-4">
        + Add Item
      </button>

      {/* 💰 Total */}
      <h2 className="text-lg font-semibold mb-4">
        Total: ₹{total}
      </h2>

      {/* 💾 Save */}
      <button
        onClick={saveInvoice}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Save Invoice
      </button>


    </div>
  )
}