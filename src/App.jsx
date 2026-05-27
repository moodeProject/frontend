import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import WorkerManagement from './pages/WorkerManagement'
import WorkerRegistration from './pages/WorkerRegistration'
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
          <Route path="/" element={<Placeholder title="대시보드" />} />
          <Route path="/workers" element={<WorkerManagement />} />
          <Route path="/workers/new" element={<WorkerRegistration />} />
          <Route path="/monitoring" element={<Placeholder title="실시간 모니터링" />} />
          <Route path="/events" element={<Placeholder title="위험 이벤트" />} />
          <Route path="/records" element={<Placeholder title="작업 기록" />} />
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
