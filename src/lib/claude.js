/**
 * Cliente wrapper que llama al proxy serverless /api/claude.
 * Nunca incluye la API key — vive solo server-side en Vercel env vars.
 *
 * Ejemplo:
 *   const res = await askClaude({
 *     system: 'Eres una IA clinica que redacta drafts para medicos.',
 *     messages: [{ role: 'user', content: 'Redacta draft de derivacion para Luis F. TSH 8.2' }],
 *   })
 *   console.log(res.content)
 */
export async function askClaude({ system, messages, model, max_tokens, cache = true } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('askClaude requires non-empty messages array')
  }
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, model, max_tokens, cache }),
  })
  const data = await resp.json()
  if (!resp.ok) {
    const msg = data?.message || data?.error || 'claude_request_failed'
    const err = new Error(msg)
    err.status = resp.status
    err.body = data
    throw err
  }
  return data
}
