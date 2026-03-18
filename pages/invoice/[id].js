import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function InvoiceDetails() {
  const router = useRouter()
  const { id } = router.query

  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])

  const invoiceRef = useRef()

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {

    // 🔹 Fetch invoice + customer
    const { data: inv, error } = await supabase
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
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error("Invoice error:", error)
      return
    }

    setInvoice(inv)

    // 🔹 Fetch items + products
    const { data: itemData, error: itemError } = await supabase
      .from('invoice_items')
      .select(`
        qty,
        price,
        products (
          name
        )
      `)
      .eq('invoice_id', id)

    if (itemError) {
      console.error("Items error:", itemError)
      setItems([])
      return
    }

    setItems(itemData ?? [])
  }

  // 📄 PDF DOWNLOAD
  const downloadPDF = async () => {
    const element = invoiceRef.current

    const canvas = await html2canvas(element, { scale: 2 })
    const data = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')

    const imgProps = pdf.getImageProperties(data)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight)

    pdf.save(`invoice-${invoice.id.slice(0, 6)}.pdf`)
  }

  if (!invoice) {
    return <div className="p-6">Loading invoice...</div>
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* 🔝 HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Invoice #{invoice.id.slice(0, 6)}
          </h1>
          <p className="text-gray-500">
            {new Date(invoice.created_at).toDateString()}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={downloadPDF}
            className="border px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Download PDF
          </button>

          <button
            onClick={() => router.push('/invoice')}
            className="bg-gray-100 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>
      </div>

      {/* 📄 INVOICE CONTENT */}
      <div
        ref={invoiceRef}
        className="bg-white p-6 rounded-xl border shadow-sm"
      >

        {/* 👤 CUSTOMER */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Customer</h2>
          <p>{invoice.customers?.name}</p>
          <p className="text-gray-500 text-sm">
            {invoice.customers?.phone}
          </p>
        </div>

        {/* 📦 ITEMS */}
        <table className="w-full text-sm mb-6">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="text-left p-2">Product</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">
                  {item.products?.name}
                </td>
                <td className="text-center">
                  {item.qty}
                </td>
                <td className="text-center">
                  ₹{item.price}
                </td>
                <td className="text-center">
                  ₹{item.qty * item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 💰 TOTAL */}
        <div className="text-right">
          <h2 className="text-xl font-bold">
            Total: ₹{invoice.total}
          </h2>
        </div>

      </div>

    </div>
  )
}