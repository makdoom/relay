import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};
