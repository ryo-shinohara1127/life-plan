import { useEffect, useState } from 'react'
import { api, todayISODate, type Reflection } from '../lib/api'

const fieldStyle: React.CSSProperties = { width: '100%', marginBottom: '1rem' }

export function ReflectionPage() {
  const date = todayISODate()
  const [existing, setExisting] = useState<Reflection | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  const [achieved, setAchieved] = useState('')
  const [notAchieved, setNotAchieved] = useState('')
  const [reason, setReason] = useState('')
  const [learning, setLearning] = useState('')
  const [improvementIdea, setImprovementIdea] = useState('')
  const [mood, setMood] = useState(3)
  const [focusLevel, setFocusLevel] = useState(3)
  const [sleepHours, setSleepHours] = useState('')

  useEffect(() => {
    api.getReflectionByDate(date).then(setExisting)
  }, [date])

  const save = async () => {
    setSaving(true)
    try {
      const saved = await api.createReflection({
        date,
        achieved: achieved || undefined,
        not_achieved: notAchieved || undefined,
        reason: reason || undefined,
        learning: learning || undefined,
        improvement_idea: improvementIdea || undefined,
        mood,
        focus_level: focusLevel,
        sleep_hours: sleepHours ? Number(sleepHours) : undefined,
      })
      setExisting(saved)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (existing === undefined) return <p>読み込み中...</p>

  if (existing) {
    return (
      <div style={{ maxWidth: 600 }}>
        <h1>振り返り</h1>
        <p style={{ color: '#888' }}>{date} はすでに記録済みです。</p>
        <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
          <p><strong>できたこと：</strong>{existing.achieved || '（未記入）'}</p>
          <p><strong>できなかったこと：</strong>{existing.not_achieved || '（未記入）'}</p>
          <p><strong>理由：</strong>{existing.reason || '（未記入）'}</p>
          <p><strong>今日の学び：</strong>{existing.learning || '（未記入）'}</p>
          <p><strong>改善案：</strong>{existing.improvement_idea || '（未記入）'}</p>
          <p><strong>気分：</strong>{existing.mood ?? '-'} / 5　<strong>集中度：</strong>{existing.focus_level ?? '-'} / 5　<strong>睡眠：</strong>{existing.sleep_hours ?? '-'}時間</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <h1>振り返り</h1>
      <p style={{ color: '#888' }}>{date}</p>

      <label>できたこと</label>
      <textarea style={fieldStyle} rows={2} value={achieved} onChange={(e) => setAchieved(e.target.value)} />

      <label>できなかったこと</label>
      <textarea style={fieldStyle} rows={2} value={notAchieved} onChange={(e) => setNotAchieved(e.target.value)} />

      <label>その理由</label>
      <textarea style={fieldStyle} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />

      <label>今日の学び</label>
      <textarea style={fieldStyle} rows={2} value={learning} onChange={(e) => setLearning(e.target.value)} />

      <label>改善案</label>
      <textarea style={fieldStyle} rows={2} value={improvementIdea} onChange={(e) => setImprovementIdea(e.target.value)} />

      <label>気分（1〜5）</label>
      <input
        style={fieldStyle}
        type="range"
        min={1}
        max={5}
        value={mood}
        onChange={(e) => setMood(Number(e.target.value))}
      />
      <p style={{ marginTop: '-0.75rem', color: '#888' }}>{mood}</p>

      <label>集中度（1〜5）</label>
      <input
        style={fieldStyle}
        type="range"
        min={1}
        max={5}
        value={focusLevel}
        onChange={(e) => setFocusLevel(Number(e.target.value))}
      />
      <p style={{ marginTop: '-0.75rem', color: '#888' }}>{focusLevel}</p>

      <label>睡眠時間</label>
      <input
        style={fieldStyle}
        type="number"
        step="0.5"
        placeholder="例: 6.5"
        value={sleepHours}
        onChange={(e) => setSleepHours(e.target.value)}
      />

      <button onClick={save} disabled={saving}>
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  )
}
