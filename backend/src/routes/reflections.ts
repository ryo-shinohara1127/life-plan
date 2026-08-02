import { Router } from 'express'
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
