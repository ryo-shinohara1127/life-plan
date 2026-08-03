import { useEffect, useState } from 'react'
import { api, type GoogleConnectionStatus } from '../lib/api'

export function Settings() {
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getGoogleStatus().then((s) => {
      setStatus(s)
      setLoading(false)
    })
  }

  useEffect(load, [])

  const connect = () => {
    const apiBase = import.meta.env.VITE_API_URL ?? '/api'
    window.location.href = `${apiBase}/auth/google`
  }

  const disconnect = async () => {
    await api.disconnectGoogle()
    load()
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <h1>設定</h1>

      <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid #333', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Googleカレンダー連携</h3>
        {loading && <p>確認中...</p>}
        {!loading && status?.connected && (
          <>
            <p style={{ color: '#4ade80' }}>✅ 連携済み</p>
            <button onClick={disconnect}>連携を解除する</button>
          </>
        )}
        {!loading && status && !status.connected && (
          <>
            <p style={{ color: '#888' }}>未連携です。連携すると、今日のタスク画面でGoogleカレンダーの予定を確認できます。</p>
            <button onClick={connect}>Googleカレンダーと連携する</button>
          </>
        )}
      </div>
    </div>
  )
}
