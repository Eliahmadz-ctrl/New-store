const MAX_TRANSCRIPT_LENGTH = 60000

function clipJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] || text.match(/\{[\s\S]*\}/)?.[0] || text
  return JSON.parse(candidate)
}

function normalizeMoments(moments, duration) {
  if (!Array.isArray(moments)) return []
  return moments
    .map((moment, index) => {
      const start = Math.max(0, Math.min(duration - 0.5, Number(moment.start)))
      const end = Math.max(start + 0.5, Math.min(duration, Number(moment.end)))
      return {
        id: `ai-${index + 1}`,
        title: String(moment.title || `Viral moment ${index + 1}`).slice(0, 70),
        start: Number(start.toFixed(2)),
        end: Number(end.toFixed(2)),
        score: Math.max(1, Math.min(100, Math.round(Number(moment.score) || 70))),
        reason: String(moment.reason || 'Strong standalone social moment').slice(0, 180),
        caption: String(moment.caption || '').slice(0, 160),
      }
    })
    .filter((moment) => Number.isFinite(moment.start) && Number.isFinite(moment.end) && moment.end > moment.start)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const transcript = String(body.transcript || '').trim()
  const duration = Math.max(1, Math.min(60 * 60 * 3, Number(body.duration) || 0))

  if (!transcript || !duration) return res.status(400).json({ error: 'TRANSCRIPT_AND_DURATION_REQUIRED' })
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) return res.status(413).json({ error: 'TRANSCRIPT_TOO_LONG' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'AI_API_KEY_REQUIRED' })

  const prompt = `You are an elite short-form social video editor. Identify the 3 to 6 highest-potential viral clips in the supplied transcript. Score for a strong first-second hook, conflict or curiosity, emotion, novelty, specificity, a complete standalone payoff, and natural social-platform retention. Prefer 12 to 45 second moments, avoid overlapping clips unless the value is exceptional, and do not invent words not present in the transcript.

Video duration: ${duration} seconds.
Transcript (timestamps may be present):
${transcript}

Return JSON only in this exact shape:
{"moments":[{"title":"short editorial title","start":12.4,"end":35.1,"score":94,"reason":"why this has social potential","caption":"a punchy on-screen caption using the speaker's wording"}]}`

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: prompt,
        temperature: 0.25,
        max_output_tokens: 1600,
      }),
    })

    if (!aiResponse.ok) {
      const detail = await aiResponse.text()
      console.error('AI highlight analysis failed:', aiResponse.status, detail.slice(0, 500))
      return res.status(502).json({ error: 'AI_ANALYSIS_FAILED' })
    }

    const payload = await aiResponse.json()
    const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).find((part) => part.type === 'output_text')?.text || ''
    const parsed = clipJson(text)
    const moments = normalizeMoments(parsed.moments, duration)
    if (!moments.length) return res.status(502).json({ error: 'AI_RETURNED_NO_MOMENTS' })

    return res.status(200).json({ engine: 'OpenAI', moments })
  } catch (error) {
    console.error('AI highlight analysis error:', error)
    return res.status(502).json({ error: 'AI_ANALYSIS_FAILED' })
  }
}
