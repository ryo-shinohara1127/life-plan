import { google } from 'googleapis'
import { getAuthorizedClient } from './client.js'

export type CalendarEvent = {
  id: string
  title: string
  start: string | null
  end: string | null
}

export async function listEventsForDate(date: string): Promise<CalendarEvent[]> {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  // サーバーのタイムゾーンに依存しないよう、日本時間(+09:00)を明示する。
  // 本番(Render)はサーバーがUTCで動くため、これがないと朝の予定が漏れたり
  // 翌日の予定が混ざったりする。
  const timeMin = new Date(`${date}T00:00:00+09:00`).toISOString()
  const timeMax = new Date(`${date}T23:59:59+09:00`).toISOString()

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (res.data.items ?? []).map((event) => ({
    id: event.id ?? '',
    title: event.summary ?? '(タイトルなし)',
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
  }))
}

/**
 * Phase 6（AI連携）で、ユーザーが承認した変更のみ反映するために使うラッパー。
 * MVPのPhase 4時点ではAPIルートから呼ばれず、単体では未使用。
 */
export async function createEvent(input: {
  title: string
  startDateTime: string
  endDateTime: string
}): Promise<string> {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: input.title,
      start: { dateTime: input.startDateTime },
      end: { dateTime: input.endDateTime },
    },
  })

  if (!res.data.id) throw new Error('failed to create google calendar event')
  return res.data.id
}

export async function updateEvent(
  eventId: string,
  input: { title?: string; startDateTime?: string; endDateTime?: string },
): Promise<void> {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      ...(input.title ? { summary: input.title } : {}),
      ...(input.startDateTime ? { start: { dateTime: input.startDateTime } } : {}),
      ...(input.endDateTime ? { end: { dateTime: input.endDateTime } } : {}),
    },
  })
}
