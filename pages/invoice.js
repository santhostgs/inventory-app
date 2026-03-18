// pages/invoice.js
import { useState } from 'react'
import jsPDF from "jspdf"

export default function Invoice() {
  const [total, setTotal] = useState(0)

  function generatePDF() {
    const doc = new jsPDF()
    doc.text("Invoice", 20, 20)
    doc.text("Total: ₹" + total, 20, 40)
    doc.save("invoice.pdf")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Invoice</h1>

      <div className="bg-white p-6 rounded-xl shadow max-w-md">
        <input
          type="number"
          placeholder="Enter amount"
          className="border p-2 w-full rounded mb-4"
          onChange={(e) => setTotal(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
        >
          Save
        </button>

        <button
          onClick={generatePDF}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download PDF
        </button>
      </div>
    </div>
  )
}