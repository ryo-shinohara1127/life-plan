import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, todayISODate, type LifePhilosophy, type Task } from '../lib/api'

export function Dashboard() {
  const date = todayISODate()
  const [philosophy, setPhilosophy] = useState<LifePhilosophy | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getPhilosophyHistory(), api.getTasks(date)]).then(([history, t]) => {
      setPhilosophy(history[0] ?? null)
      setTasks(t)
      setLoading(false)
    })
  }, [date])

  if (loading) return <p>読み込み中...</p>

  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>ダッシュボード</h1>
      <p style={{ color: '#888' }}>{date}</p>

      {philosophy && (
        <blockquote
          style={{
            fontSize: '1rem',
            borderLeft: '4px solid #4ade80',
            paddingLeft: '1rem',
            margin: '1.5rem 0',
            color: '#ccc',
          }}
        >
          {philosophy.content}
        </blockquote>
      )}

      <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>今日のタスク</h3>
        {tasks.length === 0 ? (
          <p style={{ color: '#888' }}>
            まだタスクがありません。<Link to="/tasks">今日のタスク画面</Link>から追加してください。
          </p>
        ) : (
          <>
            <p style={{ color: '#888' }}>
              完了 {doneCount} / {tasks.length}
            </p>
            <ul>
              {tasks.slice(0, 5).map((t) => (
                <li key={t.id} style={{ color: t.status === 'done' ? '#888' : 'inherit' }}>
                  {t.planned_start_time?.slice(0, 5)} {t.title}
                  {t.status === 'done' && ' ✓'}
                </li>
              ))}
            </ul>
            <Link to="/tasks">すべて見る →</Link>
          </>
        )}
      </div>
    </div>
  )
}
