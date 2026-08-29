import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { DetectionProvider } from './context/DetectionContext';
import { NotificationProvider } from './context/NotificationContext';
import { WorkerProvider } from './context/WorkerContext';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import ExternalDetectionDetail from './pages/ExternalDetectionDetail';
import FindId from './pages/FindId';
import FindPassword from './pages/FindPassword';
import HelmetManagement from './pages/HelmetManagement';
import IncidentDetail from './pages/IncidentDetail';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Notifications from './pages/Notifications';
import Records from './pages/Records';
import Signup from './pages/Signup';
import WorkerDetail from './pages/WorkerDetail';
import Workers from './pages/Workers';
import './styles/safehelmet.css';

export default function App() {
  return (
    <WorkerProvider>
      <DetectionProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* 인증 화면 */}
            <Route path="/login" element={<Login />} />
            <Route path="/find-id" element={<FindId />} />
            <Route path="/find-password" element={<FindPassword />} />
            <Route path="/signup" element={<Signup />} />

            {/* 로그인한 관리자만 접근 가능 */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/detections" element={<Detections />} />
                <Route path="/detections/:id" element={<ExternalDetectionDetail />} />
                <Route path="/incident" element={<IncidentDetail />} />
                <Route path="/workers" element={<Workers />} />
                <Route path="/workers/:workerId" element={<WorkerDetail />} />
                <Route path="/records" element={<Records />} />
                <Route path="/helmets" element={<HelmetManagement />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/mypage" element={<MyPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </DetectionProvider>
    </WorkerProvider>
  );
}
