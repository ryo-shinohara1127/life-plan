import { Router } from 'express'
import { pool } from '../db.js'

export const lifePhilosophyRouter = Router()

lifePhilosophyRouter.get('/', async (_req, res) => {
  const result = await pool.query('select * from life_philosophy order by created_at desc')
  res.json(result.rows)
})

lifePhilosophyRouter.post('/', async (req, res) => {
  const { content } = req.body as { content?: string }
  if (!content || !content.trim()) {
    res.status(400).json({ message: 'content is required' })
    return
  }
  const result = await pool.query(
    'insert into life_philosophy (content) values ($1) returning *',
    [content.trim()],
  )
  res.status(201).json(result.rows[0])
})
