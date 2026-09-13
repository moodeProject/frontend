import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function WorkerProtectedRoute() {
  const location = useLocation();
  const session = localStorage.getItem('safehelmet_worker_session');

  if (!session) {
    return <Navigate to="/worker/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
