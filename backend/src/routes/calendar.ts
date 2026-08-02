import { Router } from 'express'
import { listEventsForDate } from '../google/calendar.js'

export const calendarRouter = Router()

calendarRouter.get('/events', async (req, res) => {
  const { date } = req.query as { date?: string }
  if (!date) {
    res.status(400).json({ message: 'date query param is required' })
    return
  }
  try {
    const events = await listEventsForDate(date)
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: (err as Error).message })
  }
})
