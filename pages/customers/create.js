import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { validateCustomer } from '../../lib/validation'
import { FormInput } from '../../components/FormInput'
import { useToast, Toast } from '../../components/Toast'

export default function CreateCustomer() {
  const router = useRouter()
  const { show } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    gst_number: '',
    credit_limit: '',
    status: 'active',
    notes: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validateCustomer(formData)
    if (validationErrors) {
      setErrors(validationErrors)
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('customers')
        .insert([{
          ...formData,
          credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : 0,
          balance: 0
        }])

      if (error) throw error

      show.success('Customer created successfully')
      router.push('/customers')
    } catch (error) {
      console.error('Error creating customer:', error)
      show.error('Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Add New Customer</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Create a new customer record</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
             <div>
               <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Basic Information</h2>
               <div className="space-y-3 sm:space-y-4">
                 <FormInput
                   label="Customer Name"
                   name="name"
                   placeholder="e.g., Acme Corporation"
                   value={formData.name}
                   onChange={handleChange}
                   error={errors.name}
                   required
                 />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                   <FormInput
                     label="Email"
                     name="email"
                     type="email"
                     placeholder="customer@example.com"
                     value={formData.email}
                     onChange={handleChange}
                     error={errors.email}
                   />

                   <FormInput
                     label="Phone"
                     name="phone"
                     placeholder="9876543210"
                     value={formData.phone}
                     onChange={handleChange}
                     error={errors.phone}
                   />
                 </div>
               </div>
             </div>

          {/* Address Information */}
          <div>
            <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Address</h2>
            <div className="space-y-3 sm:space-y-4">
              <FormInput
                label="Address"
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <FormInput
                  label="City"
                  name="city"
                  placeholder="e.g., Mumbai"
                  value={formData.city}
                  onChange={handleChange}
                />

                <FormInput
                  label="State"
                  name="state"
                  placeholder="e.g., Maharashtra"
                  value={formData.state}
                  onChange={handleChange}
                />

                <FormInput
                  label="Postal Code"
                  name="postal_code"
                  placeholder="e.g., 400001"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Business Information</h2>
            <div className="space-y-3 sm:space-y-4">
              <FormInput
                label="GST Number"
                name="gst_number"
                placeholder="e.g., 27AABCC1234H1Z0"
                value={formData.gst_number}
                onChange={handleChange}
              />

              <FormInput
                label="Credit Limit (₹)"
                name="credit_limit"
                type="number"
                placeholder="0"
                value={formData.credit_limit}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="Add any notes about this customer..."
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition text-sm sm:text-base"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
            </div>
          </form>
        </div>

        <Toast />
      </div>
    </div>
  );
}
