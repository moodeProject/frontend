import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login         from './pages/auth/Login'
import FindId        from './pages/auth/FindId'
import ResetPassword from './pages/auth/ResetPassword'
import Register      from './pages/auth/Register'
import WorkerMobile     from './pages/worker/WorkerMobile'
import Dashboard        from './pages/Dashboard'
import AnomalyList      from './pages/AnomalyList'
import AnomalyDetail    from './pages/AnomalyDetail'
import WorkerStatus     from './pages/WorkerStatus'
import AccidentLog      from './pages/AccidentLog'
import HelmetManagement from './pages/HelmetManagement'
import { WorkerProvider } from './context/WorkerContext'
import { AuthProvider }   from './context/AuthContext'

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/anomaly"     element={<AnomalyList />} />
        <Route path="/anomaly/:id" element={<AnomalyDetail />} />
        <Route path="/workers"     element={<WorkerStatus />} />
        <Route path="/logs"     element={<AccidentLog />} />
        <Route path="/helmets"  element={<HelmetManagement />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkerProvider>
          <Routes>
            <Route path="/login"          element={<Login />} />
            <Route path="/find-id"        element={<FindId />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/worker"         element={<WorkerMobile />} />
            <Route path="/*"              element={<AppRoutes />} />
          </Routes>
        </WorkerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
