import { useEffect, useState } from 'react'
import { api, todayISODate, type Category, type CalendarEvent, type Task, type TaskStatus } from '../lib/api'

const statusLabel: Record<TaskStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了',
  skipped: 'スキップ',
}

export function TodayTasks() {
  const date = todayISODate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[] | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.getTasks(date), api.getCategories()]).then(([t, c]) => {
      setTasks(t)
      setCategories(c)
      setLoading(false)
    })

    api.getGoogleStatus().then((status) => {
      if (status.connected) {
        api.getCalendarEvents(date).then(setCalendarEvents)
      } else {
        setCalendarEvents(null)
      }
    })
  }

  useEffect(load, [date])

  const cycleStatus = async (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      not_started: 'done',
      in_progress: 'done',
      done: 'not_started',
      skipped: 'not_started',
    }
    await api.updateTaskStatus(task.id, next[task.status])
    load()
  }

  const addTask = async () => {
    if (!newTitle.trim()) return
    await api.createTask({
      title: newTitle.trim(),
      date,
      planned_start_time: newStart || undefined,
      planned_end_time: newEnd || undefined,
    })
    setNewTitle('')
    setNewStart('')
    setNewEnd('')
    load()
  }

  const removeTask = async (id: string) => {
    await api.deleteTask(id)
    load()
  }

  if (loading) return <p>読み込み中...</p>

  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>今日のタスク</h1>
      <p style={{ color: '#888' }}>
        {date}（完了 {doneCount} / {tasks.length}）
      </p>

      {calendarEvents && (
        <div style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>Googleカレンダーの予定</h3>
          {calendarEvents.length === 0 ? (
            <p style={{ color: '#888', fontSize: '0.85rem' }}>今日の予定はありません。</p>
          ) : (
            <ul style={{ fontSize: '0.85rem', color: '#ccc' }}>
              {calendarEvents.map((event) => (
                <li key={event.id}>
                  {event.start && new Date(event.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}{' '}
                  {event.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map((task) => {
          const category = categories.find((c) => c.id === task.category_id)
          return (
            <li
              key={task.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.5rem 0.75rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid #333',
              }}
            >
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={() => cycleStatus(task)}
              />
              {category && <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>[{category.name}]</span>}
              <span
                style={{
                  flex: '1 1 120px',
                  minWidth: 0,
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  color: task.status === 'done' ? '#888' : 'inherit',
                }}
              >
                {task.title}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>{statusLabel[task.status]}</span>
              <button style={{ fontSize: '0.75rem' }} onClick={() => removeTask(task.id)}>
                削除
              </button>
            </li>
          )
        })}
      </ul>

      <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>タスクを追加</h3>
        <input
          type="text"
          placeholder="タイトル"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
        <input
          type="time"
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        />
        <button onClick={addTask} disabled={!newTitle.trim()} style={{ marginLeft: '0.5rem' }}>
          追加
        </button>
      </div>
    </div>
  )
}
