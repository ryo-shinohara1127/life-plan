import { useEffect, useState } from 'react'
import './App.css'

type HealthStatus = 'checking' | 'ok' | 'error'

function App() {
  const [status, setStatus] = useState<HealthStatus>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>人生設計図</h1>
      <p>フロントエンド：起動しています</p>
      <p>
        バックエンド接続：
        {status === 'checking' && '確認中...'}
        {status === 'ok' && '✅ 接続成功'}
        {status === 'error' && '❌ 接続失敗（backendが起動しているか確認してください）'}
      </p>
    </main>
  )
}

export default App
