import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Philosophy } from './pages/Philosophy'
import { Roadmap } from './pages/Roadmap'
import { TodayTasks } from './pages/TodayTasks'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="philosophy" element={<Philosophy />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="tasks" element={<TodayTasks />} />
      </Route>
    </Routes>
  )
}

export default App
