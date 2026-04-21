import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

export const config = {
  runtime: 'nodejs',
}

/**
 * POST /api/claude
 * Body: { system, messages, model?, max_tokens?, cache? }
 * Response: { content, usage, model }
 *
 * Seguridad: key vive solo en server-side (ANTHROPIC_API_KEY).
 * Cache prompt activado por defecto cuando system > 1KB para reducir coste.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'missing_anthropic_key', hint: 'Set ANTHROPIC_API_KEY in Vercel env vars' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  } catch {
    return res.status(400).json({ error: 'invalid_json' })
  }

  const { system, messages, model = DEFAULT_MODEL, max_tokens = 1024, cache = true } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages_required' })
  }

  const client = new Anthropic({ apiKey })

  // Prompt caching: aplicar cache_control al system prompt largo para reducir coste/latencia
  let systemBlocks = undefined
  if (system) {
    if (cache && typeof system === 'string' && system.length > 1024) {
      systemBlocks = [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
    } else {
      systemBlocks = typeof system === 'string' ? [{ type: 'text', text: system }] : system
    }
  }

  try {
    const resp = await client.messages.create({
      model,
      max_tokens,
      system: systemBlocks,
      messages,
    })

    const textBlocks = (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')

    return res.status(200).json({
      content: textBlocks,
      raw: resp.content,
      usage: resp.usage,
      model: resp.model,
      stop_reason: resp.stop_reason,
    })
  } catch (err) {
    const status = err?.status || 500
    return res.status(status).json({
      error: 'anthropic_error',
      message: err?.message || String(err),
      type: err?.error?.type,
    })
  }
}
