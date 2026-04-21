import { Resend } from 'resend'

export const config = {
  runtime: 'nodejs',
}

/**
 * POST /api/resend
 * Body: { to, subject, html?, text?, from? }
 * Response: { id } o { error }
 *
 * Seguridad: key solo server-side (RESEND_API_KEY).
 * from por defecto: EVERHEALTH_FROM o 'EverHealthHormIA <noreply@resend.dev>' (sandbox).
 * En producción verificar dominio del cliente en resend.com/domains y cambiar from.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'missing_resend_key', hint: 'Set RESEND_API_KEY in Vercel env vars' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  } catch {
    return res.status(400).json({ error: 'invalid_json' })
  }

  const { to, subject, html, text, from } = body

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'missing_fields', required: ['to', 'subject', 'html|text'] })
  }

  const resend = new Resend(apiKey)
  const fromAddr = from || process.env.EVERHEALTH_FROM || 'EverHealthHormIA <noreply@resend.dev>'

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddr,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })

    if (error) {
      return res.status(400).json({ error: 'resend_error', message: error.message, name: error.name })
    }

    return res.status(200).json({ id: data?.id, from: fromAddr })
  } catch (err) {
    return res.status(500).json({ error: 'resend_exception', message: err?.message || String(err) })
  }
}
