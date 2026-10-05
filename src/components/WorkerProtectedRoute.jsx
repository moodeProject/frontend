import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

export default function WorkerProtectedRoute() {
  const location = useLocation();

  const token =
    localStorage.getItem(
      'auth_token'
    );

  const session =
    localStorage.getItem(
      'safehelmet_worker_session'
    );

  if (!token || !session) {
    return (
      <Navigate
        to="/worker/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
