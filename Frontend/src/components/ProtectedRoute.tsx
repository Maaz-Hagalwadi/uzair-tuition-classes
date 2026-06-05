import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

interface Props {
  children: React.ReactNode;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export default function ProtectedRoute({ children, role }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  if (!user.roles.includes(role)) {
    const home = ROLE_HOME[user.roles[0]] ?? '/login';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
