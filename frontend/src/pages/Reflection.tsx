import { useEffect, useState } from 'react'
import { api, todayISODate, type AISuggestion, type CalendarProposal, type Reflection } from '../lib/api'

const fieldStyle: React.CSSProperties = { width: '100%', marginBottom: '1rem' }

function AISuggestionPanel({
  reflectionId,
  onReady,
}: {
  reflectionId: string
  onReady: () => void
}) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null | undefined>(undefined)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getAISuggestion(reflectionId).then((existing) => {
      if (existing) {
        setSuggestion(existing)
        onReady()
      } else {
        setAnalyzing(true)
        api
          .analyzeReflection(reflectionId)
          .then((s) => {
            setSuggestion(s)
            onReady()
          })
          .catch((err) => setError((err as Error).message))
          .finally(() => setAnalyzing(false))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflectionId])

  if (error) {
    return (
      <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #833', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>AI分析</h3>
        <p style={{ color: '#f87171' }}>分析に失敗しました：{error}</p>
      </div>
    )
  }

  if (suggestion === undefined || analyzing) {
    return (
      <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>AI分析</h3>
        <p style={{ color: '#888' }}>分析中...</p>
      </div>
    )
  }

  if (!suggestion) return null

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>AI分析</h3>
      <p><strong>今日の要約：</strong>{suggestion.summary}</p>
      {suggestion.issues && <p><strong>課題：</strong>{suggestion.issues}</p>}
      {suggestion.hypothesis && <p><strong>原因の仮説：</strong>{suggestion.hypothesis}</p>}
      {suggestion.improvements.length > 0 && (
        <div>
          <strong>明日の改善案：</strong>
          <ul>
            {suggestion.improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {suggestion.continue_items && <p><strong>継続すべきこと：</strong>{suggestion.continue_items}</p>}
    </div>
  )
}

const proposalStatusLabel: Record<CalendarProposal['status'], string> = {
  proposed: '未対応',
  approved: '✅ 承認済み（カレンダーに反映済み）',
  rejected: '却下済み',
}

function CalendarProposalsPanel({ reflectionId }: { reflectionId: string }) {
  const [proposals, setProposals] = useState<CalendarProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    api.getCalendarProposals(reflectionId).then((p) => {
      setProposals(p)
      setLoading(false)
    })
  }

  useEffect(load, [reflectionId])

  const approve = async (id: string) => {
    setBusyId(id)
    try {
      await api.approveCalendarProposal(id)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (id: string) => {
    setBusyId(id)
    try {
      await api.rejectCalendarProposal(id)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return null
  if (proposals.length === 0) return null

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0, fontSize: '0.9rem' }}>カレンダー変更案</h3>
      {proposals.map((p) => (
        <div
          key={p.id}
          style={{ padding: '0.75rem', border: '1px solid #444', borderRadius: 6, marginBottom: '0.75rem' }}
        >
          <p style={{ margin: '0 0 0.25rem', fontWeight: 'bold' }}>
            {p.proposed_change.date} {p.proposed_change.startTime}-{p.proposed_change.endTime} {p.proposed_change.title}
          </p>
          <p style={{ margin: '0 0 0.25rem', color: '#ccc' }}>{p.description}</p>
          {p.reason && <p style={{ margin: '0 0 0.5rem', color: '#888', fontSize: '0.85rem' }}>理由：{p.reason}</p>}
          {p.status === 'proposed' ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => approve(p.id)} disabled={busyId === p.id}>
                承認する
              </button>
              <button onClick={() => reject(p.id)} disabled={busyId === p.id}>
                却下する
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.85rem', color: p.status === 'approved' ? '#4ade80' : '#888' }}>
              {proposalStatusLabel[p.status]}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export function ReflectionPage() {
  const date = todayISODate()
  const [existing, setExisting] = useState<Reflection | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [suggestionReady, setSuggestionReady] = useState(false)

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

        <AISuggestionPanel reflectionId={existing.id} onReady={() => setSuggestionReady(true)} />
        {suggestionReady && <CalendarProposalsPanel reflectionId={existing.id} />}
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
