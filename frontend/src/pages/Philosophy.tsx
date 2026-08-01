import { useEffect, useState } from 'react'
import { api, type LifePhilosophy } from '../lib/api'

export function Philosophy() {
  const [history, setHistory] = useState<LifePhilosophy[]>([])
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .getPhilosophyHistory()
      .then(setHistory)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const current = history[0]

  const startEditing = () => {
    setDraft(current?.content ?? '')
    setEditing(true)
  }

  const save = async () => {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await api.createPhilosophy(draft.trim())
      setEditing(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>人生理念</h1>

      {!editing && (
        <>
          {current ? (
            <blockquote
              style={{
                fontSize: '1.2rem',
                borderLeft: '4px solid #4ade80',
                paddingLeft: '1rem',
                margin: '1.5rem 0',
              }}
            >
              {current.content}
            </blockquote>
          ) : (
            <p style={{ color: '#888' }}>まだ理念が登録されていません。</p>
          )}
          <button onClick={startEditing}>編集する</button>
        </>
      )}

      {editing && (
        <div style={{ margin: '1.5rem 0' }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            style={{ width: '100%', fontSize: '1rem' }}
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={save} disabled={saving || !draft.trim()}>
              {saving ? '保存中...' : '保存する'}
            </button>
            <button onClick={() => setEditing(false)} disabled={saving}>
              キャンセル
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#888' }}>
            保存すると新しいバージョンとして追加され、過去の理念は下の履歴に残ります。
          </p>
        </div>
      )}

      {history.length > 1 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1rem' }}>変遷履歴</h2>
          <ul>
            {history.slice(1).map((h) => (
              <li key={h.id} style={{ marginBottom: '0.5rem', color: '#aaa' }}>
                <span style={{ fontSize: '0.8rem' }}>
                  {new Date(h.created_at).toLocaleDateString('ja-JP')}
                </span>
                ：{h.content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
