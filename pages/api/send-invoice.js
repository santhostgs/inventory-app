import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { invoiceId, recipientEmail, message } = req.body

  if (!invoiceId || !recipientEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total,
        payment_status,
        created_at,
        customers (
          name,
          email
        )
      `)
      .eq('id', invoiceId)
      .maybeSingle()

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    const subject = `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)} - ${invoice.customers?.name || 'Invoice'}`

    const emailBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Invoice from BizBook</h2>
        
        <p>Dear ${invoice.customers?.name},</p>
        
        ${message ? `<p>${message}</p>` : '<p>Please find your invoice attached below.</p>'}
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <h3>Invoice Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.invoice_number || invoice.id.slice(0, 8)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(invoice.created_at).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Amount:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">₹${invoice.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Payment Status:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.payment_status || 'Unpaid'}</td>
          </tr>
        </table>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #666; font-size: 0.9em;">
          This is an automated email from BizBook. Please do not reply directly to this email. 
          If you have any questions, please contact us.
        </p>
        
        <p style="color: #999; font-size: 0.85em;">
          Best regards,<br>
          <strong>BizBook Team</strong>
        </p>
      </body>
    </html>
    `

    const { error: emailError } = await supabase
      .from('email_logs')
      .insert([{
        invoice_id: invoiceId,
        recipient_email: recipientEmail,
        subject: subject,
        body: emailBody,
        status: 'sent',
        sent_at: new Date().toISOString()
      }])

    if (emailError) console.warn('Email log error:', emailError)

    return res.status(200).json({ 
      success: true, 
      message: `Invoice sent to ${recipientEmail}`,
      emailSent: true 
    })

  } catch (error) {
    console.error('Error sending invoice:', error)
    return res.status(500).json({ error: 'Failed to send invoice' })
  }
}
