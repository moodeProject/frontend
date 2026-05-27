import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import WorkerManagement from './pages/WorkerManagement'
import WorkerRegistration from './pages/WorkerRegistration'
import WorkRecords from './pages/WorkRecords'
import HazardEvents from './pages/HazardEvents'
import { WorkerProvider } from './context/WorkerContext'

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
      <WorkerProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workers" element={<WorkerManagement />} />
          <Route path="/workers/new" element={<WorkerRegistration />} />
          <Route path="/monitoring" element={<Placeholder title="실시간 모니터링" />} />
          <Route path="/events" element={<HazardEvents />} />
          <Route path="/records" element={<WorkRecords />} />
          <Route path="/zones" element={<Placeholder title="안전 구역 관리" />} />
          <Route path="/stats" element={<Placeholder title="통계 분석" />} />
          <Route path="/settings" element={<Placeholder title="시스템 설정" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      </WorkerProvider>
    </BrowserRouter>
  )
}
