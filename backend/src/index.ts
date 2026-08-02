import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { pool } from './db.js'
import { authRouter } from './routes/auth.js'
import { calendarRouter } from './routes/calendar.js'
import { categoriesRouter } from './routes/categories.js'
import { goalsRouter } from './routes/goals.js'
import { lifePhilosophyRouter } from './routes/lifePhilosophy.js'
import { reflectionsRouter } from './routes/reflections.js'
import { tasksRouter } from './routes/tasks.js'
import { visionsRouter } from './routes/visions.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/db-health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message })
  }
})

app.use('/api/life-philosophy', lifePhilosophyRouter)
app.use('/api/visions', visionsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/auth', authRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/reflections', reflectionsRouter)

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`)
})
