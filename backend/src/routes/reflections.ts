import { Router } from 'express'
import { getAIProvider } from '../ai/index.js'
import { pool } from '../db.js'

export const reflectionsRouter = Router()

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
    res.status(201).json(saved.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: (err as Error).message })
  }
})
