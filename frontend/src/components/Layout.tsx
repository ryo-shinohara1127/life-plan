import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'ダッシュボード' },
  { to: '/philosophy', label: '人生理念' },
  { to: '/roadmap', label: 'ロードマップ' },
  { to: '/tasks', label: '今日のタスク' },
  { to: '/settings', label: '設定' },
]

export function Layout() {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex' }}>
      <nav
        style={{
          width: 200,
          borderRight: '1px solid #333',
          padding: '1.5rem 1rem',
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>人生設計図</h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  color: isActive ? '#4ade80' : 'inherit',
                  fontWeight: isActive ? 'bold' : 'normal',
                })}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
