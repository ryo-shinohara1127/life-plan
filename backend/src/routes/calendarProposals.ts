import { Router } from 'express'
import { pool } from '../db.js'
import { createEvent } from '../google/calendar.js'

export const calendarProposalsRouter = Router()

calendarProposalsRouter.post('/:id/approve', async (req, res) => {
  const result = await pool.query('select * from ai_calendar_proposals where id = $1', [req.params.id])
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found' })
    return
  }
  const proposal = result.rows[0]
  if (proposal.status !== 'proposed') {
    res.status(409).json({ message: `already ${proposal.status}` })
    return
  }

  try {
    const change = proposal.proposed_change as { title: string; date: string; startTime: string; endTime: string }
    await createEvent({
      title: change.title,
      startDateTime: `${change.date}T${change.startTime}:00+09:00`,
      endDateTime: `${change.date}T${change.endTime}:00+09:00`,
    })

    const updated = await pool.query(
      `update ai_calendar_proposals
       set status = 'approved', reviewed_at = now(), applied_at = now()
       where id = $1
       returning *`,
      [req.params.id],
    )
    res.json(updated.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: (err as Error).message })
  }
})

calendarProposalsRouter.post('/:id/reject', async (req, res) => {
  const result = await pool.query(
    `update ai_calendar_proposals
     set status = 'rejected', reviewed_at = now()
     where id = $1 and status = 'proposed'
     returning *`,
    [req.params.id],
  )
  if (result.rows.length === 0) {
    res.status(404).json({ message: 'not found or already reviewed' })
    return
  }
  res.json(result.rows[0])
})
