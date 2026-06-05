import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (user) {
    const home = ROLE_HOME[user.roles[0]] ?? '/';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
