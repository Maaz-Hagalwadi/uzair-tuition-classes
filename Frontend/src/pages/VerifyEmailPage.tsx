import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import AuthLeftPanel from '../components/AuthLeftPanel';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is invalid or missing.');
      return;
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setMessage(res.data?.message ?? 'Email verified successfully!');
        setStatus('success');
      })
      .catch((err) => {
        setMessage(err.response?.data?.message ?? 'This link is invalid or has expired.');
        setStatus('error');
      });
  }, [token]);

  return (
    <main className="flex w-full h-screen overflow-hidden">
      <AuthLeftPanel />

      <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#faf8ff] px-6 md:px-12 lg:px-24">
        <div className="w-full max-w-md text-center">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 rounded-full border-4 border-[#eaedff] border-t-[#070235] animate-spin mx-auto mb-6" />
              <p className="text-sm text-[#505f76]">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-[#eaedff] rounded-full flex items-center justify-center mx-auto mb-6">
                <span
                  className="material-symbols-outlined text-[40px] text-[#070235]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <h2 className="font-serif text-[32px] leading-[40px] font-semibold text-[#070235] mb-3">
                Email verified!
              </h2>
              <p className="text-sm text-[#505f76] leading-relaxed">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-[#070235] text-white text-sm font-semibold rounded-lg hover:bg-[#1e1b4b] transition-all"
              >
                Go to sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-6">
                <span
                  className="material-symbols-outlined text-[40px] text-[#ba1a1a]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  error
                </span>
              </div>
              <h2 className="font-serif text-[32px] leading-[40px] font-semibold text-[#070235] mb-3">
                Verification failed
              </h2>
              <p className="text-sm text-[#505f76] leading-relaxed">{message}</p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-[#070235] text-white text-sm font-semibold rounded-lg hover:bg-[#1e1b4b] transition-all"
              >
                Try again
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
