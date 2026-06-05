import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { LOGO_B64 } from '../lib/logo';
import AuthLeftPanel from '../components/AuthLeftPanel';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
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

          {success ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-[#eaedff] rounded-full flex items-center justify-center mx-auto mb-6">
                <span
                  className="material-symbols-outlined text-[40px] text-[#070235]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock_reset
                </span>
              </div>
              <h2 className="font-serif text-[32px] leading-[40px] font-semibold text-[#070235] mb-3">
                Password updated
              </h2>
              <p className="text-sm text-[#505f76] leading-relaxed">
                Your password has been reset successfully. You can now sign in with your new
                password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-[#070235] text-white text-sm font-semibold rounded-lg hover:bg-[#1e1b4b] transition-all"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="font-serif text-[32px] leading-[40px] font-semibold text-[#070235] mb-2">
                  Set new password
                </h2>
                <p className="text-sm text-[#505f76]">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-lg px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">
                    error
                  </span>
                  {error}
                </div>
              )}

              {!token && (
                <div className="mb-6 flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-lg px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">
                    error
                  </span>
                  Invalid or missing reset token. Please request a new reset link.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#070235] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      className="block w-full pl-10 pr-10 py-3 bg-white border border-[#c8c5d0] rounded-lg text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all duration-200"
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#070235] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-[#c8c5d0] rounded-lg text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-lg text-white bg-[#070235] hover:bg-[#1e1b4b] text-base font-semibold shadow-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-70"
                >
                  {loading && (
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  )}
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
