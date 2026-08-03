import { Router } from 'express'
import { disconnect, getAuthUrl, getConnectionStatus, saveTokensFromCode } from '../google/client.js'

export const authRouter = Router()

authRouter.get('/google', (_req, res) => {
  res.redirect(getAuthUrl())
})

authRouter.get('/google/callback', async (req, res) => {
  const { code } = req.query as { code?: string }
  if (!code) {
    res.status(400).send('missing code')
    return
  }
  try {
    await saveTokensFromCode(code)
    res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/settings?connected=1`)
  } catch (err) {
    console.error(err)
    res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/settings?error=1`)
  }
})

authRouter.get('/google/status', async (_req, res) => {
  res.json(await getConnectionStatus())
})

authRouter.post('/google/disconnect', async (_req, res) => {
  await disconnect()
  res.status(204).send()
})
