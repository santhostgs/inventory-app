import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
export default function InvoicePage() {
const [invoices, setInvoices] = useState([])

useEffect(() => {
  fetchInvoices()
}, [])

const fetchInvoices = async () => {
  const { data, error } = await supabase
  .from('invoices')
  .select(`
    id,
    total,
    created_at,
    customers (
      name,
      phone
    )
  `)
  .order('created_at', { ascending: false })
  if (error) {
    console.error(error)
  } else {
    console.log(data) // 👈 check this once
    setInvoices(data)
  }
}


  return (
    <div>
      {/* 🔝 Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>

<a href="/invoice/create">
  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
    + New Invoice
  </button>
</a>
      </div>

      {/* 🔍 Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 flex gap-4">
        <input
          placeholder="Search invoice..."
          className="border px-3 py-2 rounded-lg w-1/3"
        />

        <select className="border px-3 py-2 rounded-lg">
          <option>Status</option>
          <option>Paid</option>
          <option>Pending</option>
        </select>
      </div>

      {/* 📊 Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="p-4 text-left">InvoiceId</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{inv.id}</td>
                <td className="p-4">{inv.customers?.name || "No Name"}</td>
                <td className="p-4 text-center">{inv.created_at}</td>
                <td className="p-4 text-center">₹{inv.total}</td>

                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    inv.status === 'Paid'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {inv.status}
                  </span>
                </td>

                <td className="p-4 text-center">
                  <a
  href={`/invoice/${inv.id}`}
  className="text-blue-600 hover:underline">
  View
</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}