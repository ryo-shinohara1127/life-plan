import { Router } from 'express'
import { pool } from '../db.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', async (_req, res) => {
  const result = await pool.query('select * from categories order by priority_order asc')
  res.json(result.rows)
})
