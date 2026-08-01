import { Router } from 'express'
import { pool } from '../db.js'

export const visionsRouter = Router()

visionsRouter.get('/', async (_req, res) => {
  const result = await pool.query(
    "select * from visions where status = 'active' order by created_at desc",
  )
  res.json(result.rows)
})

visionsRouter.post('/', async (req, res) => {
  const { content, target_year } = req.body as { content?: string; target_year?: number }
  if (!content || !content.trim()) {
    res.status(400).json({ message: 'content is required' })
    return
  }
  const result = await pool.query(
    'insert into visions (content, target_year) values ($1, $2) returning *',
    [content.trim(), target_year ?? null],
  )
  res.status(201).json(result.rows[0])
})

visionsRouter.patch('/:id', async (req, res) => {
  const { content, target_year, status } = req.body as {
    content?: string
    target_year?: number
    status?: string
  }
  const result = await pool.query(
    `update visions set
      content = coalesce($2, content),
      target_year = coalesce($3, target_year),
      status = coalesce($4, status),
      updated_at = now()
     where id = $1
     returning *`,
    [req.params.id, content ?? null, target_year ?? null, status ?? null],
  )
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found' })
    return
  }
  res.json(result.rows[0])
})
