import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore, type UserRole } from '../store';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = useAppStore((state) => state.token);
  const role = useAppStore((state) => state.role);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}