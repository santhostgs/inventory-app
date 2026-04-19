import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency, formatDate, getStatusBadgeColor } from '../../lib/helpers'
import { useToast, Toast } from '../../components/Toast'
import { FormInput, FormSelect } from '../../components/FormInput'
import { LoadingSpinner } from '../../components/Loading'

export default function InvoiceDetails() {
  const router = useRouter()
  const { id } = router.query
  const { toast, show } = useToast()

  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    message: ''
  })

  const invoiceRef = useRef()

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      
      const { data: inv, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total,
          tax_amount,
          tax_rate,
          discount_amount,
          payment_status,
          status,
          notes,
          created_at,
          due_date,
          customers (
            id,
            name,
            email,
            phone,
            address,
            city,
            state
          )
        `)
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      setInvoice(inv)

      const { data: itemData, error: itemError } = await supabase
        .from('invoice_items')
        .select(`
          qty,
          price,
          tax,
          discount,
          line_total,
          products (
            name,
            sku
          )
        `)
        .eq('invoice_id', id)

      if (itemError) throw itemError
      setItems(itemData || [])

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', id)
        .order('payment_date', { ascending: false })

      if (paymentError) throw paymentError
      setPayments(paymentData || [])
    } catch (error) {
      console.error('Error fetching invoice:', error)
      show.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    try {
      const element = invoiceRef.current
      const canvas = await html2canvas(element, { scale: 2 })
      const data = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(data)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`invoice-${invoice.invoice_number || invoice.id.slice(0, 6)}.pdf`)
      show.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      show.error('Failed to generate PDF')
    }
  }

  const handleSendEmail = async () => {
    const email = emailForm.recipientEmail || invoice.customers?.email
    if (!email) {
      show.error('No email address provided')
      return
    }

    try {
      setSendingEmail(true)
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: id,
          recipientEmail: email,
          message: emailForm.message
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to send invoice')

      show.success(`Invoice sent to ${email}`)
      setShowEmailForm(false)
      setEmailForm({ recipientEmail: '', message: '' })
    } catch (error) {
      console.error('Error sending invoice:', error)
      show.error(error.message || 'Failed to send invoice')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleAddPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      show.error('Please enter a valid amount')
      return
    }

    try {
      setSavingPayment(true)
      const { error } = await supabase.from('payments').insert([{
        invoice_id: id,
        customer_id: invoice.customers.id,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number,
        notes: paymentForm.notes,
        payment_date: new Date().toISOString().split('T')[0]
      }])

      if (error) throw error

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + Number(paymentForm.amount)
      const newStatus = totalPaid >= invoice.total ? 'paid' : 'partial'

      await supabase.from('invoices').update({ 
        payment_status: newStatus 
      }).eq('id', id)

      show.success('Payment recorded successfully')
      setPaymentForm({ amount: '', payment_method: 'bank_transfer', reference_number: '', notes: '' })
      setShowPaymentForm(false)
      fetchInvoice()
    } catch (error) {
      console.error('Error saving payment:', error)
      show.error('Failed to record payment')
    } finally {
      setSavingPayment(false)
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = invoice ? invoice.total - totalPaid : 0

  if (loading) return <LoadingSpinner />
  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <button
          onClick={() => router.push('/invoice')}
          className="text-blue-600 hover:underline mt-4"
        >
          Back to invoices
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{invoice.invoice_number || `Invoice #${invoice.id.slice(0, 6)}`}</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">{formatDate(invoice.created_at)}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={downloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm"
            >
              📥 Download PDF
            </button>
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm"
            >
              📧 Send Invoice
            </button>
            <button
              onClick={() => router.push('/invoice')}
              className="bg-gray-200 hover:bg-gray-300 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-xl sm:text-2xl font-bold">{formatCurrency(invoice.total)}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Amount Paid</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Remaining</p>
          <p className={`text-xl sm:text-2xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-6" ref={invoiceRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b">
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">BILL TO</h3>
                <p className="font-medium text-xs sm:text-sm">{invoice.customers?.name}</p>
                {invoice.customers?.email && <p className="text-xs sm:text-sm text-gray-600">{invoice.customers.email}</p>}
                {invoice.customers?.phone && <p className="text-xs sm:text-sm text-gray-600">{invoice.customers.phone}</p>}
                {invoice.customers?.address && <p className="text-xs sm:text-sm text-gray-600">{invoice.customers.address}</p>}
                {(invoice.customers?.city || invoice.customers?.state) && (
                  <p className="text-xs sm:text-sm text-gray-600">{invoice.customers.city}, {invoice.customers.state}</p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">INVOICE DETAILS</h3>
                <p className="text-xs sm:text-sm"><span className="text-gray-600">Invoice #:</span> {invoice.invoice_number || invoice.id.slice(0, 8)}</p>
                <p className="text-xs sm:text-sm"><span className="text-gray-600">Date:</span> {formatDate(invoice.created_at)}</p>
                {invoice.due_date && <p className="text-xs sm:text-sm"><span className="text-gray-600">Due Date:</span> {formatDate(invoice.due_date)}</p>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm mb-4 sm:mb-6">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-medium">Product / Description</th>
                    <th className="text-center p-2 sm:p-3 font-medium" style={{width: '60px'}}>Qty</th>
                    <th className="text-right p-2 sm:p-3 font-medium" style={{width: '80px'}}>Price</th>
                    <th className="text-right p-2 sm:p-3 font-medium" style={{width: '80px'}}>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 sm:p-3">
                        <p className="font-medium text-xs sm:text-sm">{item.products?.name}</p>
                        {item.products?.sku && <p className="text-xs text-gray-500">SKU: {item.products.sku}</p>}
                      </td>
                      <td className="text-center p-2 sm:p-3 text-xs sm:text-sm">{item.qty}</td>
                      <td className="text-right p-2 sm:p-3 text-xs sm:text-sm">{formatCurrency(item.price)}</td>
                      <td className="text-right p-2 sm:p-3 font-medium text-xs sm:text-sm">{formatCurrency(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-4 sm:mb-6">
              <div className="w-full sm:w-80 space-y-1 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(items.reduce((sum, item) => sum + item.qty * item.price, 0))}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-1 sm:pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="border-t pt-3 sm:pt-4">
                <p className="text-xs text-gray-600 mb-1">NOTES:</p>
                <p className="text-xs sm:text-sm text-gray-800">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 sticky top-4 sm:top-6">
            <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Invoice Status</h2>
            
            <div className="space-y-3 mb-4 sm:mb-6">
              <div>
                <p className="text-xs text-gray-600 mb-1">Payment Status</p>
                <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeColor(invoice.payment_status)}`}>
                  {invoice.payment_status || 'unpaid'}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Invoice Status</p>
                <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeColor(invoice.status)}`}>
                  {invoice.status || 'draft'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm mb-3 sm:mb-4"
            >
              {showPaymentForm ? '✕ Cancel' : '💳 Record Payment'}
            </button>

            {showEmailForm && (
              <div className="space-y-3 border-t pt-3 sm:pt-4 mb-3 sm:mb-4">
                <h3 className="font-semibold text-xs sm:text-sm">Send Invoice</h3>
                <FormInput
                  label="Recipient Email"
                  type="email"
                  placeholder={invoice.customers?.email || "customer@example.com"}
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm({...emailForm, recipientEmail: e.target.value})}
                />

                <FormInput
                  label="Message (Optional)"
                  placeholder="Add a custom message..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                />

                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium text-sm"
                >
                  {sendingEmail ? 'Sending...' : 'Send Invoice'}
                </button>
              </div>
            )}

            {showPaymentForm && (
              <div className="space-y-3 border-t pt-3 sm:pt-4">
                <FormInput
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  max={remaining}
                />

                <FormSelect
                  label="Payment Method"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  options={[
                    {id: 'cash', label: 'Cash'},
                    {id: 'cheque', label: 'Cheque'},
                    {id: 'bank_transfer', label: 'Bank Transfer'},
                    {id: 'card', label: 'Card'},
                    {id: 'upi', label: 'UPI'},
                    {id: 'other', label: 'Other'}
                  ]}
                />

                <FormInput
                  label="Reference Number"
                  placeholder="Cheque/Transaction ID"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                />

                <FormInput
                  label="Notes"
                  placeholder="Optional notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                />

                <button
                  onClick={handleAddPayment}
                  disabled={savingPayment}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium text-sm"
                >
                  {savingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            )}

            {payments.length > 0 && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Payment History</h3>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 p-2 sm:p-3 rounded text-xs sm:text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        <span className="text-gray-500 text-xs">{formatDate(payment.payment_date)}</span>
                      </div>
                      <p className="text-gray-600 text-xs">{payment.payment_method}</p>
                      {payment.reference_number && <p className="text-gray-500 text-xs">Ref: {payment.reference_number}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
              <p className="text-xs text-gray-600 text-center">
                💡 Tip: Use "Download PDF" to get a copy, or "Send Invoice" to email to customer
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => {}} />}
    </div>
  );
}