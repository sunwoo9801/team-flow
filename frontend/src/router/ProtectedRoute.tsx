import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function ProtectedRoute() {
  const { user } = useAuthStore();
  const token = sessionStorage.getItem('access_token');
  if (!user && !token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
