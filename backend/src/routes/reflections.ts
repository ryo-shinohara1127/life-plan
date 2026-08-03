import { Router } from 'express'
import { getAIProvider } from '../ai/index.js'
import { pool } from '../db.js'

export const reflectionsRouter = Router()

function nextDateISO(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

reflectionsRouter.get('/', async (_req, res) => {
  const result = await pool.query('select * from reflections order by date desc')
  res.json(result.rows)
})

reflectionsRouter.get('/:date', async (req, res) => {
  const result = await pool.query('select * from reflections where date = $1', [req.params.date])
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found' })
    return
  }
  res.json(result.rows[0])
})

reflectionsRouter.post('/', async (req, res) => {
  const {
    date,
    achieved,
    not_achieved,
    reason,
    learning,
    improvement_idea,
    mood,
    focus_level,
    sleep_hours,
  } = req.body as {
    date?: string
    achieved?: string
    not_achieved?: string
    reason?: string
    learning?: string
    improvement_idea?: string
    mood?: number
    focus_level?: number
    sleep_hours?: number
  }

  if (!date) {
    res.status(400).json({ message: 'date is required' })
    return
  }

  const existing = await pool.query('select id from reflections where date = $1', [date])
  if (existing.rows.length > 0) {
    res.status(409).json({ message: 'reflection already exists for this date' })
    return
  }

  const result = await pool.query(
    `insert into reflections
      (date, achieved, not_achieved, reason, learning, improvement_idea, mood, focus_level, sleep_hours)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      date,
      achieved ?? null,
      not_achieved ?? null,
      reason ?? null,
      learning ?? null,
      improvement_idea ?? null,
      mood ?? null,
      focus_level ?? null,
      sleep_hours ?? null,
    ],
  )
  res.status(201).json(result.rows[0])
})

reflectionsRouter.get('/:id/ai-suggestion', async (req, res) => {
  const result = await pool.query('select * from ai_suggestions where reflection_id = $1', [req.params.id])
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found' })
    return
  }
  res.json(result.rows[0])
})

reflectionsRouter.post('/:id/analyze', async (req, res) => {
  const reflectionResult = await pool.query('select * from reflections where id = $1', [req.params.id])
  if (reflectionResult.rows.length === 0) {
    res.status(404).json({ message: 'reflection not found' })
    return
  }
  const reflection = reflectionResult.rows[0]

  const existing = await pool.query('select * from ai_suggestions where reflection_id = $1', [req.params.id])
  if (existing.rows.length > 0) {
    res.json(existing.rows[0])
    return
  }

  try {
    const ai = getAIProvider()
    const analysis = await ai.analyzeReflection({
      date: reflection.date,
      achieved: reflection.achieved,
      notAchieved: reflection.not_achieved,
      reason: reflection.reason,
      learning: reflection.learning,
      improvementIdea: reflection.improvement_idea,
      mood: reflection.mood,
      focusLevel: reflection.focus_level,
      sleepHours: reflection.sleep_hours ? Number(reflection.sleep_hours) : null,
    })

    const saved = await pool.query(
      `insert into ai_suggestions
        (reflection_id, summary, issues, hypothesis, improvements, continue_items, ai_provider)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (reflection_id) do nothing
       returning *`,
      [
        req.params.id,
        analysis.summary,
        analysis.issues,
        analysis.hypothesis,
        JSON.stringify(analysis.improvements),
        analysis.continueItems,
        process.env.AI_PROVIDER ?? 'claude',
      ],
    )

    if (saved.rows.length === 0) {
      // 同時に別のリクエストが先にAI分析を保存済み（レースコンディション）。
      // 重複生成はせず、既存のものをそのまま返す。
      const already = await pool.query('select * from ai_suggestions where reflection_id = $1', [req.params.id])
      res.json(already.rows[0])
      return
    }
    const aiSuggestion = saved.rows[0]

    try {
      const proposals = await ai.proposeCalendarChanges({
        date: reflection.date,
        achieved: reflection.achieved,
        notAchieved: reflection.not_achieved,
        reason: reflection.reason,
        learning: reflection.learning,
        improvementIdea: reflection.improvement_idea,
        mood: reflection.mood,
        focusLevel: reflection.focus_level,
        sleepHours: reflection.sleep_hours ? Number(reflection.sleep_hours) : null,
        tomorrowDate: nextDateISO(reflection.date),
      })

      for (const p of proposals) {
        await pool.query(
          `insert into ai_calendar_proposals
            (ai_suggestion_id, description, proposed_change, reason)
           values ($1, $2, $3, $4)`,
          [
            aiSuggestion.id,
            p.description,
            JSON.stringify({ title: p.title, date: p.date, startTime: p.startTime, endTime: p.endTime }),
            p.reason,
          ],
        )
      }
    } catch (err) {
      // カレンダー変更案の生成に失敗しても、要約・改善案自体は保存済みなので致命的にしない
      console.error('failed to generate calendar proposals', err)
    }

    res.status(201).json(aiSuggestion)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: (err as Error).message })
  }
})

reflectionsRouter.get('/:id/calendar-proposals', async (req, res) => {
  const result = await pool.query(
    `select acp.* from ai_calendar_proposals acp
     join ai_suggestions s on acp.ai_suggestion_id = s.id
     where s.reflection_id = $1
     order by acp.created_at asc`,
    [req.params.id],
  )
  res.json(result.rows)
})
