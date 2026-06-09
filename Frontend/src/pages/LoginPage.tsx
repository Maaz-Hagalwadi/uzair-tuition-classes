import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import AuthLeftPanel from '../components/AuthLeftPanel';
import Logo from '../components/Logo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-[#ba1a1a]">
      <span className="material-symbols-outlined text-[14px]">error</span>
      {msg}
    </p>
  );
}

function inputClass(hasError: boolean) {
  return `block w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:ring-2 transition-all duration-200 ${
    hasError
      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
      : 'border-[#c8c5d0] focus:border-[#070235] focus:ring-[#070235]/10'
  }`;
}

function passwordInputClass(hasError: boolean) {
  return `block w-full pl-10 pr-10 py-3 bg-white border rounded-xl text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:ring-2 transition-all duration-200 ${
    hasError
      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
      : 'border-[#c8c5d0] focus:border-[#070235] focus:ring-[#070235]/10'
  }`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched]   = useState<{ email: boolean; password: boolean }>({ email: false, password: false });

  function validateEmail(val: string)    { if (!val.trim()) return 'Email is required.'; if (!EMAIL_RE.test(val)) return 'Enter a valid email address.'; }
  function validatePassword(val: string) { if (!val) return 'Password is required.'; }
  function validate() {
    const e: Record<string, string> = {};
    const eE = validateEmail(email);    if (eE) e.email = eE;
    const eP = validatePassword(password); if (eP) e.password = eP;
    return e;
  }
  function handleBlur(field: 'email' | 'password') {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === 'email')    setErrors((e) => ({ ...e, email:    validateEmail(email) }));
    else                      setErrors((e) => ({ ...e, password: validatePassword(password) }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = validate();
    setTouched({ email: true, password: true });
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;
    setServerError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.accessToken, { firstName: data.firstName, lastName: data.lastName, email: data.email, roles: data.roles });
      const role: string = data.roles[0];
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex w-full h-screen overflow-hidden">
      <AuthLeftPanel />

      {/* Mobile navbar */}
      <nav className="fixed top-0 left-0 right-0 lg:hidden flex items-center justify-between px-5 h-14 bg-white border-b border-[#e4e2e6] z-50">
        <Link to="/"><Logo size={28} textColor="#1e1b4b" /></Link>
        <Link to="/" className="flex items-center justify-center w-8 h-8 text-[#505f76] hover:text-[#070235] transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
      </nav>

      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8ff] px-6 md:px-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-md pt-20 lg:pt-0 pb-10">

          {/* Heading */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-[28px] lg:text-[34px] leading-tight font-bold text-[#070235] mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Welcome back.
            </h2>
            <p className="text-[13px] text-[#505f76]">
              Enter your credentials to access your portal.
            </p>
          </div>

          {/* Google */}
          <div className="mb-6">
            <button type="button"
              onClick={() => { window.location.href = '/oauth2/authorization/google'; }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#c8c5d0] rounded-xl bg-white hover:bg-[#f2f3ff] transition-all duration-200 text-sm text-[#070235]">
              <GoogleIcon />
              <span className="font-medium">Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#c8c5d0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#faf8ff] text-[#505f76] text-[11px] tracking-widest uppercase">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-xl px-4 py-3 text-sm">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#070235] mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors((p) => ({ ...p, email: validateEmail(e.target.value) })); }}
                  onBlur={() => handleBlur('email')}
                  autoComplete="email" placeholder="name@email.com"
                  className={inputClass(!!errors.email && touched.email)} />
              </div>
              {touched.email && <FieldError msg={errors.email} />}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] font-medium text-[#070235]">Password</label>
                <Link to="/forgot-password" className="text-[13px] font-semibold text-[#070235] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors((p) => ({ ...p, password: validatePassword(e.target.value) })); }}
                  onBlur={() => handleBlur('password')}
                  autoComplete="current-password" placeholder="••••••••"
                  className={passwordInputClass(!!errors.password && touched.password)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#505f76] hover:text-[#070235] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {touched.password && <FieldError msg={errors.password} />}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-white bg-[#070235] hover:bg-[#1e1b4b] text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
              {loading && <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px] text-[#505f76]">
            New here?{' '}
            <Link to="/register" className="font-semibold text-[#070235] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
