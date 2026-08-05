import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './Layout.css'

const navItems = [
  { to: '/', label: 'ダッシュボード' },
  { to: '/philosophy', label: '人生理念' },
  { to: '/roadmap', label: 'ロードマップ' },
  { to: '/tasks', label: '今日のタスク' },
  { to: '/reflection', label: '振り返り' },
  { to: '/settings', label: '設定' },
]

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="app-shell" style={{ fontFamily: 'sans-serif' }}>
      <header className="app-topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="メニューを開く"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
        <h2>人生設計図</h2>
      </header>

      {menuOpen && <div className="app-backdrop" onClick={() => setMenuOpen(false)} />}

      <nav className={menuOpen ? 'app-nav open' : 'app-nav'}>
        <div className="app-nav-header">
          <h2>人生設計図</h2>
          <button
            type="button"
            className="menu-close"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
