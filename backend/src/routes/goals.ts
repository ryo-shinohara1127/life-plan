import { Router } from 'express'
import { pool } from '../db.js'

export const goalsRouter = Router()

goalsRouter.get('/', async (_req, res) => {
  const result = await pool.query('select * from goals order by start_date asc nulls last')
  res.json(result.rows)
})

goalsRouter.post('/', async (req, res) => {
  const {
    vision_id,
    parent_goal_id,
    category_id,
    level,
    title,
    description,
    start_date,
    end_date,
  } = req.body as {
    vision_id?: string
    parent_goal_id?: string
    category_id?: string
    level?: string
    title?: string
    description?: string
    start_date?: string
    end_date?: string
  }

  if (!title || !title.trim()) {
    res.status(400).json({ message: 'title is required' })
    return
  }
  if (!level || !['year', 'quarter', 'month', 'week'].includes(level)) {
    res.status(400).json({ message: 'level must be one of year/quarter/month/week' })
    return
  }

  const result = await pool.query(
    `insert into goals
      (vision_id, parent_goal_id, category_id, level, title, description, start_date, end_date)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      vision_id ?? null,
      parent_goal_id ?? null,
      category_id ?? null,
      level,
      title.trim(),
      description ?? null,
      start_date ?? null,
      end_date ?? null,
    ],
  )
  res.status(201).json(result.rows[0])
})

goalsRouter.patch('/:id', async (req, res) => {
  const { title, description, status, start_date, end_date } = req.body as {
    title?: string
    description?: string
    status?: string
    start_date?: string
    end_date?: string
  }
  const result = await pool.query(
    `update goals set
      title = coalesce($2, title),
      description = coalesce($3, description),
      status = coalesce($4, status),
      start_date = coalesce($5, start_date),
      end_date = coalesce($6, end_date),
      updated_at = now()
     where id = $1
     returning *`,
    [req.params.id, title ?? null, description ?? null, status ?? null, start_date ?? null, end_date ?? null],
  )
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found' })
    return
  }
  res.json(result.rows[0])
})

goalsRouter.delete('/:id', async (req, res) => {
  await pool.query('delete from goals where id = $1', [req.params.id])
  res.status(204).send()
})
