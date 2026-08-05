import { useEffect, useState } from 'react'
import { api, type Category, type Goal, type GoalLevel, type Vision } from '../lib/api'

const levelLabel: Record<GoalLevel, string> = {
  year: '1年目標',
  quarter: '3か月目標',
  month: '月目標',
  week: '週目標',
}

const nextLevel: Record<GoalLevel, GoalLevel | null> = {
  year: 'quarter',
  quarter: 'month',
  month: 'week',
  week: null,
}

function GoalNode({
  goal,
  goals,
  categories,
  onAddChild,
  onChanged,
}: {
  goal: Goal
  goals: Goal[]
  categories: Category[]
  onAddChild: (parent: Goal) => void
  onChanged: () => void
}) {
  const children = goals.filter((g) => g.parent_goal_id === goal.id)
  const category = categories.find((c) => c.id === goal.category_id)
  const canHaveChildren = nextLevel[goal.level] !== null

  const toggleDone = async () => {
    await api.updateGoal(goal.id, { status: goal.status === 'done' ? 'not_started' : 'done' })
    onChanged()
  }

  const remove = async () => {
    await api.deleteGoal(goal.id)
    onChanged()
  }

  return (
    <div style={{ marginLeft: '1.25rem', borderLeft: '1px solid #333', paddingLeft: '1rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" checked={goal.status === 'done'} onChange={toggleDone} />
        <span style={{ fontSize: '0.75rem', color: '#4ade80', whiteSpace: 'nowrap' }}>{levelLabel[goal.level]}</span>
        {category && <span style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>[{category.name}]</span>}
        <strong style={{ flex: '1 1 120px', minWidth: 0, textDecoration: goal.status === 'done' ? 'line-through' : 'none' }}>
          {goal.title}
        </strong>
        {canHaveChildren && (
          <button style={{ fontSize: '0.75rem' }} onClick={() => onAddChild(goal)}>
            + 下位目標を追加
          </button>
        )}
        <button style={{ fontSize: '0.75rem' }} onClick={remove}>
          削除
        </button>
      </div>
      {goal.description && <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0.25rem 0 0' }}>{goal.description}</p>}
      {children.map((child) => (
        <GoalNode
          key={child.id}
          goal={child}
          goals={goals}
          categories={categories}
          onAddChild={onAddChild}
          onChanged={onChanged}
        />
      ))}
    </div>
  )
}

export function Roadmap() {
  const [visions, setVisions] = useState<Vision[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [newVisionContent, setNewVisionContent] = useState('')
  const [newVisionYear, setNewVisionYear] = useState('')

  const [formTarget, setFormTarget] = useState<
    { kind: 'vision'; vision: Vision } | { kind: 'goal'; parent: Goal } | null
  >(null)
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.getVisions(), api.getGoals(), api.getCategories()]).then(
      ([v, g, c]) => {
        setVisions(v)
        setGoals(g)
        setCategories(c)
        setLoading(false)
      },
    )
  }

  useEffect(load, [])

  const addVision = async () => {
    if (!newVisionContent.trim()) return
    await api.createVision(newVisionContent.trim(), newVisionYear ? Number(newVisionYear) : undefined)
    setNewVisionContent('')
    setNewVisionYear('')
    load()
  }

  const submitGoalForm = async () => {
    if (!formTitle.trim() || !formTarget) return
    if (formTarget.kind === 'vision') {
      await api.createGoal({
        title: formTitle.trim(),
        level: 'year',
        vision_id: formTarget.vision.id,
        category_id: formCategory || undefined,
      })
    } else {
      const level = nextLevel[formTarget.parent.level]
      if (!level) return
      await api.createGoal({
        title: formTitle.trim(),
        level,
        parent_goal_id: formTarget.parent.id,
        category_id: formCategory || formTarget.parent.category_id || undefined,
      })
    }
    setFormTarget(null)
    setFormTitle('')
    setFormCategory('')
    load()
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>ロードマップ</h1>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>
        3〜5年後の人物像を起点に、1年目標 → 3か月目標 → 月目標 → 週目標の階層で管理します。
      </p>

      <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>新しい人物像を追加</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="3〜5年後、どんな人になっていたいか"
            value={newVisionContent}
            onChange={(e) => setNewVisionContent(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: 0, boxSizing: 'border-box' }}
          />
          <input
            type="number"
            placeholder="目標年（例:2030）"
            value={newVisionYear}
            onChange={(e) => setNewVisionYear(e.target.value)}
            style={{ flex: '0 1 120px', minWidth: 0, boxSizing: 'border-box' }}
          />
          <button onClick={addVision} disabled={!newVisionContent.trim()}>
            追加
          </button>
        </div>
      </div>

      {visions.map((vision) => (
        <div key={vision.id} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem' }}>
            {vision.content} {vision.target_year && <span style={{ color: '#888' }}>({vision.target_year}年)</span>}
          </h2>
          <button style={{ fontSize: '0.8rem' }} onClick={() => setFormTarget({ kind: 'vision', vision })}>
            + 1年目標を追加
          </button>

          {goals
            .filter((g) => g.vision_id === vision.id && g.level === 'year')
            .map((goal) => (
              <GoalNode
                key={goal.id}
                goal={goal}
                goals={goals}
                categories={categories}
                onAddChild={(parent) => setFormTarget({ kind: 'goal', parent })}
                onChanged={load}
              />
            ))}
        </div>
      ))}

      {formTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: 8, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0 }}>
              {formTarget.kind === 'vision'
                ? '1年目標を追加'
                : `${levelLabel[nextLevel[formTarget.parent.level]!]}を追加`}
            </h3>
            <input
              type="text"
              placeholder="タイトル"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              <option value="">テーマを選択（任意）</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={submitGoalForm} disabled={!formTitle.trim()}>
                追加する
              </button>
              <button onClick={() => setFormTarget(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
