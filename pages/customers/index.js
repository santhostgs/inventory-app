import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { getStatusBadgeColor } from '../../lib/helpers'
import { useToast, Toast } from '../../components/Toast'
import { LoadingSkeleton } from '../../components/Loading'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast, show } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, statusFilter])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      show.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = [...customers]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone?.includes(term) ||
        customer.gst_number?.includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }

    setFilteredCustomers(filtered)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCustomers(customers.filter(c => c.id !== id))
      show.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      show.error('Failed to delete customer')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage your customer database</p>
          </div>

          <Link href="/customers/create">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition text-sm sm:text-base">
              + Add Customer
            </button>
          </Link>
        </div>

        <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <input
              placeholder="Search by name, email, phone, or GST..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="text-xs sm:text-sm text-gray-600 flex items-center">
              {filteredCustomers.length} of {customers.length} customers
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={5} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
                </p>
                {customers.length === 0 && (
                  <Link href="/customers/create">
                    <button className="text-blue-600 hover:underline mt-4 font-medium">
                      Create your first customer →
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700">Name</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700 hidden sm:table-cell">Email</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700 hidden md:table-cell">Phone</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-left font-medium text-gray-700 hidden lg:table-cell">GST Number</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-center font-medium text-gray-700 hidden sm:table-cell">Balance</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-center font-medium text-gray-700">Status</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 text-center font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 text-xs sm:text-sm">
                          <div>
                            <p>{customer.name}</p>
                            <p className="text-gray-600 sm:hidden text-xs">{customer.email || '—'}</p>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                          {customer.email || '—'}
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm hidden md:table-cell">
                          {customer.phone || '—'}
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 text-xs font-mono hidden lg:table-cell">
                          {customer.gst_number || '—'}
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-right font-medium text-xs sm:text-sm hidden sm:table-cell">
                          <span className={customer.balance > 0 ? 'text-red-600' : 'text-gray-600'}>
                            ₹{(customer.balance || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            getStatusBadgeColor(customer.status)
                          }`}>
                            {customer.status || 'active'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                          <div className="flex gap-1 sm:gap-2 justify-center">
                            <Link href={`/customers/${customer.id}`}>
                              <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                                Edit
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(customer.id)}
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

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => {}} />}
      </div>
    </div>
  );
}
