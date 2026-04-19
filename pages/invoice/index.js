import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, getStatusBadgeColor } from '../../lib/helpers'
import { useToast, Toast } from '../../components/Toast'
import { LoadingSkeleton } from '../../components/Loading'

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const { toast, show } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total,
          payment_status,
          status,
          created_at,
          due_date,
          customers (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      show.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(term) ||
        inv.customers?.name?.toLowerCase().includes(term) ||
        inv.customers?.email?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.payment_status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will also delete all invoice items.')) return

    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', id)
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      
      setInvoices(invoices.filter(inv => inv.id !== id))
      show.success('Invoice deleted successfully')
    } catch (error) {
      console.error('Error deleting invoice:', error)
      show.error('Failed to delete invoice')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage your invoices and payments</p>
          </div>

          <a href="/invoice/create">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition text-sm sm:text-base">
              + New Invoice
            </button>
          </a>
        </div>

        <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <input
            placeholder="Search by invoice number, customer, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial Payment</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700">Invoice #</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700">Customer</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700 hidden sm:table-cell">Date</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-right font-medium text-gray-700">Amount</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-center font-medium text-gray-700">Status</th>
                    <th className="px-2 sm:px-4 md:px-6 py-3 text-center font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 text-xs sm:text-sm">
                        {inv.invoice_number || inv.id.slice(0, 8)}
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">{inv.customers?.name}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{inv.customers?.email}</p>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                        {formatDate(inv.created_at)}
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-right font-semibold text-xs sm:text-sm">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusBadgeColor(inv.payment_status)
                        }`}>
                          {inv.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                        <div className="flex gap-1 sm:gap-2 justify-center">
                          <a href={`/invoice/${inv.id}`} className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            View
                          </a>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
                          >
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
      )}

        {!loading && invoices.length > 0 && (
          <p className="mt-4 text-xs sm:text-sm text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </p>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => {}} />}
    </div>
  );
}