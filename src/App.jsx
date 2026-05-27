import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import Layout from './components/Layout'

// Auth pages (사이드바 없음)
import Login         from './pages/auth/Login'
import FindId        from './pages/auth/FindId'
import ResetPassword from './pages/auth/ResetPassword'
import Register      from './pages/auth/Register'

// App pages (사이드바 있음)
import Dashboard          from './pages/Dashboard'
import WorkerManagement   from './pages/WorkerManagement'
import WorkerRegistration from './pages/WorkerRegistration'
import WorkRecords        from './pages/WorkRecords'
import HazardEvents       from './pages/HazardEvents'
import ZoneManagement     from './pages/ZoneManagement'
import Statistics         from './pages/Statistics'
import SystemSettings     from './pages/SystemSettings'
import Monitoring         from './pages/Monitoring'
import MonitoringMap      from './pages/MonitoringMap'
import MonitoringStatus   from './pages/MonitoringStatus'

import { WorkerProvider } from './context/WorkerContext'
import { AuthProvider }   from './context/AuthContext'
import WorkerDetail       from './pages/WorkerDetail'

// 사이드바가 포함된 앱 페이지 래퍼
function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/workers"   element={<WorkerManagement />} />
        <Route path="/workers/new"  element={<WorkerRegistration />} />
        <Route path="/workers/:id"  element={<WorkerDetail />} />
        <Route path="/monitoring"        element={<Monitoring />} />
        <Route path="/monitoring/map"    element={<MonitoringMap />} />
        <Route path="/monitoring/status" element={<MonitoringStatus />} />
        <Route path="/events"    element={<HazardEvents />} />
        <Route path="/records"   element={<WorkRecords />} />
        <Route path="/zones"     element={<ZoneManagement />} />
        <Route path="/stats"     element={<Statistics />} />
        <Route path="/settings"  element={<SystemSettings />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function Placeholder({ title }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '18px' }}>
      {title} 페이지 (준비 중)
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <WorkerProvider>
        <Routes>
          {/* ── 인증 페이지 (사이드바 없음) ── */}
          <Route path="/login"          element={<Login />} />
          <Route path="/find-id"        element={<FindId />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register"       element={<Register />} />

          {/* ── 앱 페이지 (사이드바 있음) ── */}
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </WorkerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
