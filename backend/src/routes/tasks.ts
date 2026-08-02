import { Router } from 'express'
import { pool } from '../db.js'
import { routineForWeekday } from '../routine.js'

export const tasksRouter = Router()

tasksRouter.get('/', async (req, res) => {
  const { date } = req.query as { date?: string }
  if (!date) {
    res.status(400).json({ message: 'date query param is required' })
    return
  }
  const result = await pool.query(
    'select * from tasks where date = $1 order by planned_start_time asc nulls last',
    [date],
  )
  res.json(result.rows)
})

tasksRouter.post('/', async (req, res) => {
  const {
    title,
    date,
    goal_id,
    category_id,
    description,
    planned_start_time,
    planned_end_time,
    is_routine,
  } = req.body as {
    title?: string
    date?: string
    goal_id?: string
    category_id?: string
    description?: string
    planned_start_time?: string
    planned_end_time?: string
    is_routine?: boolean
  }

  if (!title || !title.trim() || !date) {
    res.status(400).json({ message: 'title and date are required' })
    return
  }

  const result = await pool.query(
    `insert into tasks
      (title, date, goal_id, category_id, description, planned_start_time, planned_end_time, is_routine)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      title.trim(),
      date,
      goal_id ?? null,
      category_id ?? null,
      description ?? null,
      planned_start_time ?? null,
      planned_end_time ?? null,
      is_routine ?? false,
    ],
  )
  res.status(201).json(result.rows[0])
})

tasksRouter.patch('/:id', async (req, res) => {
  const { status, title, description } = req.body as {
    status?: string
    title?: string
    description?: string
  }
  const result = await pool.query(
    `update tasks set
      status = coalesce($2, status),
      title = coalesce($3, title),
      description = coalesce($4, description),
      updated_at = now()
     where id = $1
     returning *`,
    [req.params.id, status ?? null, title ?? null, description ?? null],
  )
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found' })
    return
  }
  res.json(result.rows[0])
})

tasksRouter.delete('/:id', async (req, res) => {
  await pool.query('delete from tasks where id = $1', [req.params.id])
  res.status(204).send()
})

tasksRouter.post('/generate-routine', async (req, res) => {
  const { date } = req.body as { date?: string }
  if (!date) {
    res.status(400).json({ message: 'date is required' })
    return
  }

  const existing = await pool.query('select 1 from tasks where date = $1 and is_routine = true', [date])
  if ((existing.rowCount ?? 0) > 0) {
    res.status(409).json({ message: 'routine already generated for this date' })
    return
  }

  const weekday = new Date(`${date}T00:00:00`).getDay()
  const items = routineForWeekday(weekday)

  const categories = await pool.query('select id, name from categories')
  const categoryIdByName = new Map<string, string>(categories.rows.map((c) => [c.name, c.id]))

  const inserted = []
  for (const item of items) {
    const categoryId = item.categoryName ? categoryIdByName.get(item.categoryName) ?? null : null
    const result = await pool.query(
      `insert into tasks (title, date, category_id, planned_start_time, planned_end_time, is_routine)
       values ($1, $2, $3, $4, $5, true)
       returning *`,
      [item.title, date, categoryId, item.start, item.end],
    )
    inserted.push(result.rows[0])
  }

  res.status(201).json(inserted)
})
