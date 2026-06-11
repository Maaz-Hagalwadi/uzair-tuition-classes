import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import LogoSpinner from '../components/LogoSpinner';

export default function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token     = params.get('token');
    const roles     = params.get('roles');
    const firstName = params.get('firstName') ?? '';
    const lastName  = params.get('lastName')  ?? '';
    const email     = params.get('email')     ?? '';

    if (!token || !roles) {
      navigate('/login');
      return;
    }

    setAuth(token, { firstName, lastName, email, roles: [roles] });

    if (roles === 'ADMIN')        navigate('/admin');
    else if (roles === 'TEACHER') navigate('/teacher');
    else                          navigate('/student');
  }, []);

  return <LogoSpinner message="Signing you in…" fullScreen />;
}
