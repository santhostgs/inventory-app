import { useRouter } from 'next/router'
import { useEffect, useState, useRef, useCallback } from 'react'
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
  const { toast, show, clear } = useToast()

  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const [ui, setUI] = useState({
    showPaymentForm: false,
    showEmailForm: false,
    savingPayment: false,
    sendingEmail: false
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  })

  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    message: ''
  })

  const invoiceRef = useRef(null)

  // -----------------------------
  // Helpers
  // -----------------------------
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const remaining = invoice ? Number(invoice.total || 0) - totalPaid : 0

  const safeId = invoice?.id?.slice(0, 6)

  // -----------------------------
  // Fetch Data
  // -----------------------------
  const fetchInvoice = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)

      const { data: inv, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (*)
        `)
        .eq('id', id)
        .maybeSingle()

      if (error) throw error

      const [itemsRes, paymentsRes] = await Promise.all([
        supabase
          .from('invoice_items')
          .select(`*, products(name, sku)`)
          .eq('invoice_id', id),

        supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', id)
          .order('payment_date', { ascending: false })
      ])

      if (itemsRes.error) throw itemsRes.error
      if (paymentsRes.error) throw paymentsRes.error

      setInvoice(inv)
      setItems(itemsRes.data || [])
      setPayments(paymentsRes.data || [])

    } catch (err) {
      console.error(err)
      show.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [id, show])

  useEffect(() => {
    if (!router.isReady) return
    fetchInvoice()
  }, [router.isReady, fetchInvoice])

  // -----------------------------
  // PDF Download
  // -----------------------------
  const downloadPDF = async () => {
    if (!invoiceRef.current) {
      show.error('Invoice not ready')
      return
    }

    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 })
      const img = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const props = pdf.getImageProperties(img)

      const width = pdf.internal.pageSize.getWidth()
      const height = (props.height * width) / props.width

      pdf.addImage(img, 'PNG', 0, 0, width, height)
      pdf.save(`invoice-${invoice?.invoice_number || safeId}.pdf`)

      show.success('PDF downloaded')
    } catch (err) {
      console.error(err)
      show.error('PDF generation failed')
    }
  }

  // -----------------------------
  // Send Email
  // -----------------------------
  const handleSendEmail = async () => {
    const email = emailForm.recipientEmail || invoice?.customers?.email

    if (!email) {
      show.error('No email address')
      return
    }

    try {
      setUI(prev => ({ ...prev, sendingEmail: true }))

      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id, recipientEmail: email, message: emailForm.message })
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        throw new Error('Invalid server response')
      }

      if (!res.ok) throw new Error(data.error || 'Failed')

      show.success(`Sent to ${email}`)

      setEmailForm({ recipientEmail: '', message: '' })
      setUI(prev => ({ ...prev, showEmailForm: false }))

    } catch (err) {
      console.error(err)
      show.error(err.message)
    } finally {
      setUI(prev => ({ ...prev, sendingEmail: false }))
    }
  }

  // -----------------------------
  // Add Payment
  // -----------------------------
  const handleAddPayment = async () => {
    const amount = Number(paymentForm.amount)

    if (!amount || amount <= 0) {
      show.error('Invalid amount')
      return
    }

    if (!invoice?.customers?.id) {
      show.error('Customer missing')
      return
    }

    try {
      setUI(prev => ({ ...prev, savingPayment: true }))

      const { error } = await supabase.from('payments').insert([{
        invoice_id: id,
        customer_id: invoice.customers.id,
        amount,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number,
        notes: paymentForm.notes,
        payment_date: new Date().toISOString().split('T')[0]
      }])

      if (error) throw error

      const newTotal = totalPaid + amount
      const status = newTotal >= invoice.total ? 'paid' : 'partial'

      await supabase.from('invoices')
        .update({ payment_status: status })
        .eq('id', id)

      show.success('Payment saved')

      setPaymentForm({
        amount: '',
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: ''
      })

      setUI(prev => ({ ...prev, showPaymentForm: false }))
      fetchInvoice()

    } catch (err) {
      console.error(err)
      show.error('Payment failed')
    } finally {
      setUI(prev => ({ ...prev, savingPayment: false }))
    }
  }

  // -----------------------------
  // UI States
  // -----------------------------
  if (loading) return <LoadingSpinner />

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <button onClick={() => router.push('/invoice')} className="text-blue-600 mt-4">
          Back
        </button>
      </div>
    )
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">
        {invoice.invoice_number || `Invoice #${safeId}`}
      </h1>

      <p className="text-gray-500">{formatDate(invoice.created_at)}</p>

      <div ref={invoiceRef} className="bg-white p-4 mt-4 border rounded">
        <p><strong>Customer:</strong> {invoice.customers?.name}</p>
        <p><strong>Total:</strong> {formatCurrency(invoice.total)}</p>
        <p><strong>Paid:</strong> {formatCurrency(totalPaid)}</p>
        <p><strong>Remaining:</strong> {formatCurrency(remaining)}</p>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={downloadPDF} className="bg-green-600 text-white px-3 py-2 rounded">
          Download PDF
        </button>

        <button onClick={() => setUI(p => ({ ...p, showEmailForm: !p.showEmailForm }))}>
          Send Email
        </button>

        <button onClick={() => setUI(p => ({ ...p, showPaymentForm: !p.showPaymentForm }))}>
          Add Payment
        </button>
      </div>

      {ui.showEmailForm && (
        <div className="mt-4">
          <FormInput
            label="Email"
            value={emailForm.recipientEmail}
            onChange={e => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
          />
          <button onClick={handleSendEmail}>
            {ui.sendingEmail ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}

      {ui.showPaymentForm && (
        <div className="mt-4">
          <FormInput
            label="Amount"
            type="number"
            value={paymentForm.amount}
            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />

          <FormSelect
            label="Method"
            value={paymentForm.payment_method}
            onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
            options={[
              { id: 'cash', label: 'Cash' },
              { id: 'upi', label: 'UPI' }
            ]}
          />

          <button onClick={handleAddPayment}>
            {ui.savingPayment ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {toast && <Toast {...toast} onClose={clear} />}
    </div>
  )
}
