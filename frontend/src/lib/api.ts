const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export type LifePhilosophy = {
  id: string
  content: string
  created_at: string
}

export type Vision = {
  id: string
  content: string
  target_year: number | null
  status: string
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  type: 'pillar' | 'daily_touch'
  priority_order: number
}

export type GoalLevel = 'year' | 'quarter' | 'month' | 'week'

export type Goal = {
  id: string
  vision_id: string | null
  parent_goal_id: string | null
  category_id: string | null
  level: GoalLevel
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: string
}

export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'skipped'

export type Task = {
  id: string
  goal_id: string | null
  category_id: string | null
  title: string
  description: string | null
  date: string
  planned_start_time: string | null
  planned_end_time: string | null
  status: TaskStatus
  is_routine: boolean
}

export type GoogleConnectionStatus =
  | { connected: false }
  | { connected: true; calendarId: string; updatedAt: string }

export type CalendarEvent = {
  id: string
  title: string
  start: string | null
  end: string | null
}

export type Reflection = {
  id: string
  date: string
  achieved: string | null
  not_achieved: string | null
  reason: string | null
  learning: string | null
  improvement_idea: string | null
  mood: number | null
  focus_level: number | null
  sleep_hours: string | null
  created_at: string
}

export type ReflectionInput = {
  date: string
  achieved?: string
  not_achieved?: string
  reason?: string
  learning?: string
  improvement_idea?: string
  mood?: number
  focus_level?: number
  sleep_hours?: number
}

export type AISuggestion = {
  id: string
  reflection_id: string
  summary: string
  issues: string | null
  hypothesis: string | null
  improvements: string[]
  continue_items: string | null
  ai_provider: string
  created_at: string
}

export const api = {
  getPhilosophyHistory: () => request<LifePhilosophy[]>('/life-philosophy'),
  createPhilosophy: (content: string) =>
    request<LifePhilosophy>('/life-philosophy', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getVisions: () => request<Vision[]>('/visions'),
  createVision: (content: string, target_year?: number) =>
    request<Vision>('/visions', { method: 'POST', body: JSON.stringify({ content, target_year }) }),

  getCategories: () => request<Category[]>('/categories'),

  getGoals: () => request<Goal[]>('/goals'),
  createGoal: (input: {
    title: string
    level: GoalLevel
    vision_id?: string
    parent_goal_id?: string
    category_id?: string
    description?: string
    start_date?: string
    end_date?: string
  }) => request<Goal>('/goals', { method: 'POST', body: JSON.stringify(input) }),
  updateGoal: (id: string, input: Partial<Pick<Goal, 'title' | 'description' | 'status'>>) =>
    request<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteGoal: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),

  getTasks: (date: string) => request<Task[]>(`/tasks?date=${date}`),
  createTask: (input: {
    title: string
    date: string
    category_id?: string
    goal_id?: string
    description?: string
    planned_start_time?: string
    planned_end_time?: string
  }) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateTaskStatus: (id: string, status: TaskStatus) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  generateRoutine: (date: string) =>
    request<Task[]>('/tasks/generate-routine', { method: 'POST', body: JSON.stringify({ date }) }),

  getGoogleStatus: () => request<GoogleConnectionStatus>('/auth/google/status'),
  disconnectGoogle: () => request<void>('/auth/google/disconnect', { method: 'POST' }),

  getCalendarEvents: (date: string) => request<CalendarEvent[]>(`/calendar/events?date=${date}`),

  getReflectionByDate: async (date: string): Promise<Reflection | null> => {
    const res = await fetch(`${BASE_URL}/reflections/${date}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json() as Promise<Reflection>
  },
  createReflection: (input: ReflectionInput) =>
    request<Reflection>('/reflections', { method: 'POST', body: JSON.stringify(input) }),
  getReflectionHistory: () => request<Reflection[]>('/reflections'),

  analyzeReflection: (reflectionId: string) =>
    request<AISuggestion>(`/reflections/${reflectionId}/analyze`, { method: 'POST' }),
  getAISuggestion: async (reflectionId: string): Promise<AISuggestion | null> => {
    const res = await fetch(`${BASE_URL}/reflections/${reflectionId}/ai-suggestion`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json() as Promise<AISuggestion>
  },
}

export function todayISODate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
