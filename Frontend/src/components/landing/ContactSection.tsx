import { useState } from 'react';
import axios from 'axios';

const COURSES = ['Mathematics', 'Physics', 'Chemistry', 'Other'];

export default function ContactSection() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    interestedCourse: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/public/leads', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        interestedCourse: form.interestedCourse || null,
        message: form.message.trim() || null,
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-12 px-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Left */}
        <div className="space-y-5">
          <h2 className="font-headline text-[#0f172a] text-2xl font-bold leading-tight">
            Want to know more?
          </h2>
          <p className="text-sm text-[#464555] leading-relaxed">
            Leave your details and we'll call you back to discuss the right batch for your child.
          </p>

          <div className="space-y-4">
            {[
              { icon: 'mail', text: 'info@uzairtuition.com' },
              { icon: 'call', text: '+92 300 1234567' },
              { icon: 'location_on', text: '123 Education Street, Karachi' },
              { icon: 'schedule', text: 'Mon–Sat: 9:00 AM – 7:00 PM' },
            ].map((item) => (
              <div key={item.icon} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[rgba(30,27,75,0.1)] text-[#1e1b4b] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="bg-white border border-[#c7c4d8] rounded-2xl p-6 shadow-lg">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-green-600 text-[28px]">check_circle</span>
              </div>
              <h3 className="font-headline font-bold text-base mb-1">We'll call you soon!</h3>
              <p className="text-xs text-[#464555]">Usually within a few hours during office hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-lg px-3 py-2 text-xs">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#464555] mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ali Khan"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  className="w-full border border-[#c7c4d8] rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1e1b4b] focus:border-[#1e1b4b] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#464555] mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="name@email.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="w-full border border-[#c7c4d8] rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1e1b4b] focus:border-[#1e1b4b] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#464555] mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className="w-full border border-[#c7c4d8] rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1e1b4b] focus:border-[#1e1b4b] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#464555] mb-1">
                  Interested Course <span className="font-normal text-[#787680]">(optional)</span>
                </label>
                <select
                  value={form.interestedCourse}
                  onChange={(e) => set('interestedCourse', e.target.value)}
                  className="w-full border border-[#c7c4d8] rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#1e1b4b] outline-none transition-all"
                >
                  <option value="">Select a course…</option>
                  {COURSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#464555] mb-1">
                  Message <span className="font-normal text-[#787680]">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Any questions or details you'd like to share…"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  className="w-full border border-[#c7c4d8] rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1e1b4b] focus:border-[#1e1b4b] outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1e1b4b] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Request Callback'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
