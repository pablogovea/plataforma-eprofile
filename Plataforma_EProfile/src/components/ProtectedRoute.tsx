import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { AppRole } from '../types/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loading } from './ui';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles: AppRole[] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Verificando sesión…" />;
  if (!user) {
    const loginPath = location.pathname === '/admin' ? '/admin/login' : `${location.pathname}/login`;
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  if (!role || !roles.includes(role)) return <Navigate to="/sin-acceso" replace />;
  return <>{children}</>;
}
