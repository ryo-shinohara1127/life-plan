import { google } from 'googleapis'
import { pool } from '../db.js'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export function getAuthUrl(): string {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function saveTokensFromCode(code: string) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error('Google returned incomplete tokens')
  }

  await pool.query('delete from google_calendar_tokens')
  await pool.query(
    `insert into google_calendar_tokens (access_token, refresh_token, expiry)
     values ($1, $2, $3)`,
    [tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date)],
  )
}

export async function getConnectionStatus() {
  const result = await pool.query('select calendar_id, updated_at from google_calendar_tokens limit 1')
  if (result.rows.length === 0) return { connected: false }
  return { connected: true, calendarId: result.rows[0].calendar_id, updatedAt: result.rows[0].updated_at }
}

export async function disconnect() {
  await pool.query('delete from google_calendar_tokens')
}

/** 認証済みのOAuth2クライアントを返す。トークンが自動更新された場合はDBへ反映する。 */
export async function getAuthorizedClient() {
  const result = await pool.query('select * from google_calendar_tokens limit 1')
  if (result.rows.length === 0) {
    throw new Error('Google Calendar not connected')
  }
  const row = result.rows[0]

  const client = createOAuthClient()
  client.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: new Date(row.expiry).getTime(),
  })

  client.on('tokens', (tokens) => {
    if (tokens.access_token && tokens.expiry_date) {
      pool
        .query(
          `update google_calendar_tokens set access_token = $1, expiry = $2, updated_at = now() where id = $3`,
          [tokens.access_token, new Date(tokens.expiry_date), row.id],
        )
        .catch((err) => console.error('failed to persist refreshed google token', err))
    }
  })

  return client
}
