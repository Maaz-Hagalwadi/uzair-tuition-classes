import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { LOGO_B64 } from '../lib/logo';
import AuthLeftPanel from '../components/AuthLeftPanel';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // always show success to avoid email enumeration
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <main className="flex w-full h-screen overflow-hidden">
      <AuthLeftPanel />

      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8ff] px-6 md:px-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-md py-12">
          <div className="lg:hidden mb-8 flex justify-center">
            <img src={LOGO_B64} alt="Uzair Tuition" className="h-12 w-auto" />
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-[#eaedff] rounded-full flex items-center justify-center mx-auto mb-6">
                <span
                  className="material-symbols-outlined text-[40px] text-[#070235]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mark_email_read
                </span>
              </div>
              <h2 className="font-serif text-[32px] leading-[40px] font-semibold text-[#070235] mb-3">
                Check your email
              </h2>
              <p className="text-sm text-[#505f76] leading-relaxed">
                If an account exists for <strong className="text-[#131b2e]">{email}</strong>, you'll
                receive a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-[#070235] text-white text-sm font-semibold rounded-lg hover:bg-[#1e1b4b] transition-all"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="font-serif text-[32px] leading-[40px] font-semibold text-[#070235] mb-2">
                  Reset password
                </h2>
                <p className="text-sm text-[#505f76]">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#070235] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="name@university.edu"
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-[#c8c5d0] rounded-lg text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-lg text-white bg-[#070235] hover:bg-[#1e1b4b] text-base font-semibold shadow-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-70"
                >
                  {loading && (
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  )}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-[#505f76]">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold text-[#070235] hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
