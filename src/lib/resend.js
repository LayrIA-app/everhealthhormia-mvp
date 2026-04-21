/**
 * Cliente wrapper para /api/resend.
 *
 * Ejemplo:
 *   await sendEmail({
 *     to: 'paciente@ejemplo.com',
 *     subject: 'Tu analitica esta lista',
 *     html: '<p>Resultados disponibles en tu panel.</p>',
 *   })
 */
export async function sendEmail({ to, subject, html, text, from } = {}) {
  if (!to || !subject || (!html && !text)) {
    throw new Error('sendEmail requires { to, subject, html|text }')
  }
  const resp = await fetch('/api/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, text, from }),
  })
  const data = await resp.json()
  if (!resp.ok) {
    const err = new Error(data?.message || data?.error || 'resend_failed')
    err.status = resp.status
    err.body = data
    throw err
  }
  return data
}
