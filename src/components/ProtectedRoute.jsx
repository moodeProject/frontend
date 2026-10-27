import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

export default function ProtectedRoute() {
  const location = useLocation();

  const token =
    localStorage.getItem(
      'safehelmet_admin_token'
    );

  const currentAdmin =
    localStorage.getItem(
      'safehelmet_current_admin'
    );

  let adminTokenValid = false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    adminTokenValid = payload.userType === 'ADMIN' && Number(payload.exp) * 1000 > Date.now();
  } catch {
    adminTokenValid = false;
  }

  if (!token || !currentAdmin || !adminTokenValid) {
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
