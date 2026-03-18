import { useState } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from "jspdf"

export default function Invoice() {
  const [total, setTotal] = useState(0)

  async function createInvoice() {
    let { data } = await supabase
      .from('invoices')
      .insert([{ total }])
      .select()

    alert("Invoice Created: " + data[0].id)
  }

  // ✅ STEP 6: PDF FUNCTION HERE
  function generatePDF() {
    const doc = new jsPDF()

    doc.text("Invoice", 20, 20)
    doc.text("Customer: Ravi", 20, 40)
    doc.text("Total: ₹" + total, 20, 60)

    doc.save("invoice.pdf")
  }

  return (
    <div>
      <h1>Create Invoice</h1>

      <input
        type="number"
        placeholder="Total"
        onChange={(e) => setTotal(e.target.value)}
      />

      <br /><br />

      <button onClick={createInvoice}>
        Save Invoice
      </button>

      <button onClick={generatePDF} style={{ marginLeft: "10px" }}>
        Download PDF
      </button>
    </div>
  )
}