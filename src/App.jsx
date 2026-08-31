import SensorApiTest from './pages/SensorApiTest'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { DetectionProvider } from './context/DetectionContext';
import { NotificationProvider } from './context/NotificationContext';
import { WorkerProvider } from './context/WorkerContext';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import ExternalDetectionDetail from './pages/ExternalDetectionDetail';
import HealthDetectionDetail from './pages/HealthDetectionDetail';
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

import WorkerProtectedRoute from './components/WorkerProtectedRoute';
import WorkerLogin from './pages/worker/WorkerLogin';
import WorkerHome from './pages/worker/WorkerHome';
import WorkerAttendance from './pages/worker/WorkerAttendance';
import WorkerRecords from './pages/worker/WorkerRecords';
import WorkerNearby from './pages/worker/WorkerNearby';
import WorkerHealth from './pages/worker/WorkerHealth';
import WorkerHazards from './pages/worker/WorkerHazards';
import WorkerAlerts from './pages/worker/WorkerAlerts';
import WorkerSOS from './pages/worker/WorkerSOS';
import WorkerFallAlert from './pages/worker/WorkerFallAlert';
import WorkerSettings from './pages/worker/WorkerSettings';
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

            {/* 근로자 모바일 웹 */}
            <Route path="/worker/login" element={<WorkerLogin />} />
            <Route element={<WorkerProtectedRoute />}>
              <Route path="/worker" element={<WorkerHome />} />
              <Route path="/worker/home" element={<WorkerHome />} />
              <Route path="/worker/attendance" element={<WorkerAttendance />} />
              <Route path="/worker/records" element={<WorkerRecords />} />
              <Route path="/worker/nearby" element={<WorkerNearby />} />
              <Route path="/worker/health" element={<WorkerHealth />} />
              <Route path="/worker/hazards" element={<WorkerHazards />} />
              <Route path="/worker/alerts" element={<WorkerAlerts />} />
              <Route path="/worker/sos" element={<WorkerSOS />} />
              <Route path="/worker/fall-alert" element={<WorkerFallAlert />} />
              <Route path="/worker/settings" element={<WorkerSettings />} />
            </Route>

            {/* 로그인한 관리자만 접근 가능 */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/detections" element={<Detections />} />
                <Route path="/detections/health/:id" element={<HealthDetectionDetail />} />
                <Route path="/detections/:id" element={<ExternalDetectionDetail />} />
                <Route path="/incident/:id" element={<IncidentDetail />} />
                <Route path="/incident" element={<IncidentDetail />} />
                <Route path="/workers" element={<Workers />} />
                <Route path="/workers/:workerId" element={<WorkerDetail />} />
                <Route path="/records" element={<Records />} />
                <Route path="/helmets" element={<HelmetManagement />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/mypage" element={<MyPage />} />
              </Route>
            </Route>

            {/* API 테스트 전용 */}
            <Route path="/sensor-test" element={<SensorApiTest />} />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </DetectionProvider>
    </WorkerProvider>
  );
}
