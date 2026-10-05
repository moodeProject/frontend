import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

export default function ProtectedRoute() {
  const location = useLocation();

  const token =
    localStorage.getItem(
      'auth_token'
    );

  const currentAdmin =
    localStorage.getItem(
      'safehelmet_current_admin'
    );

  if (!token || !currentAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
