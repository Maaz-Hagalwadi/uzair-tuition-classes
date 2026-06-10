import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import AuthLeftPanel from '../components/AuthLeftPanel';
import Logo, { LogoMark } from '../components/Logo';

type Role = 'STUDENT' | 'TEACHER';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z\s\-']+$/;
const PHONE_RE = /^\d{10}$/;

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

function getInputClass(hasError: boolean, withIcon = false) {
  const base = `block w-full ${withIcon ? 'pl-10 pr-4' : 'px-4'} py-3 bg-white border rounded-xl text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:ring-2 transition-all duration-200`;
  return `${base} ${
    hasError
      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
      : 'border-[#c8c5d0] focus:border-[#070235] focus:ring-[#070235]/10'
  }`;
}

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-[#ba1a1a]' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-[#e8740c]' };
  return { score, label: 'Strong', color: 'bg-[#1a6b3a]' };
}

type Fields = 'firstName' | 'lastName' | 'email' | 'phone' | 'password';
type Errors = Partial<Record<Fields, string>>;
type Touched = Partial<Record<Fields, boolean>>;

function validateFirstName(v: string): string | undefined {
  if (!v.trim()) return 'First name is required.';
  if (v.trim().length < 2) return 'Must be at least 2 characters.';
  if (v.trim().length > 50) return 'Must be 50 characters or fewer.';
  if (!NAME_RE.test(v)) return 'Only letters, spaces, hyphens, and apostrophes allowed.';
}

function validateLastName(v: string): string | undefined {
  if (!v.trim()) return 'Last name is required.';
  if (v.trim().length < 2) return 'Must be at least 2 characters.';
  if (v.trim().length > 50) return 'Must be 50 characters or fewer.';
  if (!NAME_RE.test(v)) return 'Only letters, spaces, hyphens, and apostrophes allowed.';
}

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
}

function validatePhone(v: string): string | undefined {
  if (!v.trim()) return 'Phone number is required.';
  if (!PHONE_RE.test(v)) return 'Enter a valid 10-digit phone number.';
}

function validatePassword(v: string): string | undefined {
  if (!v) return 'Password is required.';
  if (v.length < 6) return 'Password must be at least 6 characters.';
}

function runAll(fields: { firstName: string; lastName: string; email: string; phone: string; password: string }): Errors {
  const e: Errors = {};
  const fN = validateFirstName(fields.firstName);
  if (fN) e.firstName = fN;
  const lN = validateLastName(fields.lastName);
  if (lN) e.lastName = lN;
  const em = validateEmail(fields.email);
  if (em) e.email = em;
  const ph = validatePhone(fields.phone);
  if (ph) e.phone = ph;
  const pw = validatePassword(fields.password);
  if (pw) e.password = pw;
  return e;
}

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('STUDENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});

  const strength = getPasswordStrength(password);

  function blurField(field: Fields, value: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    let msg: string | undefined;
    if (field === 'firstName') msg = validateFirstName(value);
    else if (field === 'lastName') msg = validateLastName(value);
    else if (field === 'email') msg = validateEmail(value);
    else if (field === 'phone') msg = validatePhone(value);
    else if (field === 'password') msg = validatePassword(value);
    setErrors((e) => ({ ...e, [field]: msg }));
  }

  function changeField(field: Fields, value: string, setter: (v: string) => void) {
    setter(value);
    if (touched[field]) {
      let msg: string | undefined;
      if (field === 'firstName') msg = validateFirstName(value);
      else if (field === 'lastName') msg = validateLastName(value);
      else if (field === 'email') msg = validateEmail(value);
      else if (field === 'phone') msg = validatePhone(value);
      else if (field === 'password') msg = validatePassword(value);
      setErrors((e) => ({ ...e, [field]: msg }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = runAll({ firstName, lastName, email, phone, password });
    setTouched({ firstName: true, lastName: true, email: true, phone: true, password: true });
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setServerError('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
      });
      setSuccess(true);
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (googleLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#faf8ff] gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl border-4 border-[#e4e2e6] border-t-[#070235] animate-spin absolute" />
          <LogoMark size={44} />
        </div>
        <p className="text-sm text-[#505f76] font-medium">Redirecting to Google…</p>
      </div>
    );
  }

  if (success) {
    return (
      <main className="flex w-full h-screen overflow-hidden">
        <AuthLeftPanel />
        <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8ff] px-6 md:px-12 lg:px-24">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-[#eaedff] rounded-full flex items-center justify-center mx-auto mb-6">
              <span
                className="material-symbols-outlined text-[40px] text-[#070235]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mark_email_read
              </span>
            </div>
            <h2 className="text-[32px] leading-[40px] font-bold text-[#070235] mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Check your email
            </h2>
            <p className="text-sm text-[#505f76] leading-relaxed">
              We sent a verification link to <strong className="text-[#131b2e]">{email}</strong>.
              Click it to activate your account.
            </p>
            {role === 'TEACHER' && (
              <p className="text-sm text-[#505f76] leading-relaxed mt-3">
                After verification, your account will be reviewed by an admin before you can sign in.
              </p>
            )}
            <Link
              to="/login"
              className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-[#070235] text-white text-sm font-semibold rounded-lg hover:bg-[#1e1b4b] transition-all"
            >
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

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

      <section className="w-full lg:w-1/2 flex items-start justify-center bg-[#faf8ff] px-6 md:px-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-md pt-16 lg:pt-10 pb-12">

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-[26px] lg:text-[32px] leading-tight font-bold text-[#070235] mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Create account.
            </h2>
            <p className="text-[13px] text-[#505f76]">
              Join thousands of students and educators on our platform.
            </p>
          </div>

          {/* Google */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => { setGoogleLoading(true); window.location.href = '/oauth2/authorization/google'; }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#c8c5d0] rounded-xl bg-white hover:bg-[#f2f3ff] transition-all duration-200 text-sm text-[#070235]"
            >
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
                Or register with email
              </span>
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-6 flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-xl px-4 py-3 text-sm">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-[13px] font-medium text-[#070235] mb-1.5">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {(['STUDENT', 'TEACHER'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      role === r
                        ? 'border-[#070235] bg-[#eaedff] text-[#070235]'
                        : 'border-[#c8c5d0] bg-white text-[#505f76] hover:bg-[#f2f3ff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {r === 'STUDENT' ? 'school' : 'cast_for_education'}
                    </span>
                    {r === 'STUDENT' ? 'Student' : 'Teacher'}
                  </button>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#070235] mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => changeField('firstName', e.target.value, setFirstName)}
                  onBlur={() => blurField('firstName', firstName)}
                  autoComplete="given-name"
                  placeholder="Enter first name"
                  className={getInputClass(!!errors.firstName && !!touched.firstName)}
                />
                {touched.firstName && <FieldError msg={errors.firstName} />}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#070235] mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => changeField('lastName', e.target.value, setLastName)}
                  onBlur={() => blurField('lastName', lastName)}
                  autoComplete="family-name"
                  placeholder="Enter last name"
                  className={getInputClass(!!errors.lastName && !!touched.lastName)}
                />
                {touched.lastName && <FieldError msg={errors.lastName} />}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-[#070235] mb-1.5">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => changeField('email', e.target.value, setEmail)}
                  onBlur={() => blurField('email', email)}
                  autoComplete="email"
                  placeholder="Enter your email"
                  className={getInputClass(!!errors.email && !!touched.email, true)}
                />
              </div>
              {touched.email && <FieldError msg={errors.email} />}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[13px] font-medium text-[#070235] mb-1.5">
                Phone number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[20px]">phone</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => changeField('phone', e.target.value, setPhone)}
                  onBlur={() => blurField('phone', phone)}
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  className={getInputClass(!!errors.phone && !!touched.phone, true)}
                />
              </div>
              {touched.phone && <FieldError msg={errors.phone} />}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-[#070235] mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => changeField('password', e.target.value, setPassword)}
                  onBlur={() => blurField('password', password)}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  className={`block w-full pl-10 pr-10 py-3 bg-white border rounded-xl text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password && touched.password
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
                      : 'border-[#c8c5d0] focus:border-[#070235] focus:ring-[#070235]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#505f76] hover:text-[#070235] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {touched.password && <FieldError msg={errors.password} />}

              {password && !errors.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-[#e4e2e6]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 2 ? 'text-[#ba1a1a]' : strength.score <= 3 ? 'text-[#e8740c]' : 'text-[#1a6b3a]'
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-white bg-[#070235] hover:bg-[#1e1b4b] text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            >
              {loading && (
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              )}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px] text-[#505f76]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#070235] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
