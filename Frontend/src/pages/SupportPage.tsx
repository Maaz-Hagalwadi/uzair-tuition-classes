import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import DashboardShell, { type NavItem } from '../components/DashboardShell';
import { useAuthStore } from '../stores/authStore';
import { ADMIN_NAV } from '../lib/adminNav';
import { TEACHER_NAV } from '../lib/teacherNav';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  TEACHER: TEACHER_NAV,
  ADMIN:   ADMIN_NAV,
};

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: 'How do I enroll in a course?',
    a: 'Go to Browse Courses, find a batch you want to join, and click Enroll. Your request will be reviewed by the admin and approved once payment is confirmed offline.',
  },
  {
    q: 'How do I join an online session?',
    a: 'Go to My Schedule and find your upcoming session. If a meeting link is available, a Join button will appear — click it to open Google Meet, Zoom, or Teams.',
  },
  {
    q: 'Where can I find course materials?',
    a: 'Open My Courses, find the course, and click the Files button in the Materials column. All uploaded PDFs and documents will be listed there.',
  },
  {
    q: 'How is my attendance tracked?',
    a: 'Your teacher marks attendance after each session. You can view your per-batch attendance percentage and session history on the Attendance page.',
  },
  {
    q: 'How do I change my password?',
    a: 'Go to My Profile (click your name in the top-right corner) and use the Change Password section at the bottom of the page.',
  },
  {
    q: 'What should I do if my enrollment is rejected?',
    a: 'Contact the admin to confirm your payment details. Once payment is verified offline, the admin can re-approve your request.',
  },
];

const QUICK_LINKS = [
  { icon: 'person',          label: 'My Profile',    description: 'Update name, phone, photo',   href: '#profile' },
  { icon: 'lock',            label: 'Change Password', description: 'Update your login password', href: '#profile' },
  { icon: 'calendar_month',  label: 'My Schedule',   description: 'View upcoming sessions',       href: '#schedule' },
  { icon: 'fact_check',      label: 'Attendance',    description: 'Track your attendance record', href: '#attendance' },
];

export default function SupportPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] ?? 'STUDENT';
  const nav  = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.STUDENT;

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: () => api.post('/support/message', { subject: subject.trim(), message: message.trim() }),
    onSuccess: () => {
      setSent(true);
      setSubject('');
      setMessage('');
      setError(null);
      setTimeout(() => setSent(false), 5000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? 'Failed to send message. Please try again.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    sendMutation.mutate();
  }

  return (
    <DashboardShell navItems={nav}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">Help & Support</h1>
          <p className="text-[13px] text-[#64748b] mt-0.5">Find answers or get in touch with the team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — FAQ + Quick Links */}
          <div className="lg:col-span-2 space-y-6">

            {/* FAQ */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#64748b]">quiz</span>
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">Frequently Asked Questions</h2>
                </div>
              </div>
              <div className="divide-y divide-[#f8fafc]">
                {FAQS.map((faq, i) => (
                  <div key={i}>
                    <button
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#fafbff] transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="text-[13px] font-medium text-[#0f172a] pr-4">{faq.q}</span>
                      <span
                        className="material-symbols-outlined text-[18px] text-[#94a3b8] shrink-0 transition-transform duration-200"
                        style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        expand_more
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-4 bg-[#fafbff]">
                        <p className="text-[12px] text-[#64748b] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#64748b]">mail</span>
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">Send a Message</h2>
                </div>
                <p className="text-[12px] text-[#94a3b8] mt-0.5">We typically respond within 1 business day</p>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {sent && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[12px] font-medium text-[#16a34a]">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    Message sent! We'll get back to you shortly.
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[12px] font-medium text-[#dc2626]">
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    placeholder="e.g. Issue with enrollment, payment query…"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    placeholder="Describe your issue or question in detail…"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2f5a)' }}
                  >
                    {sendMutation.isPending
                      ? <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                      : <span className="material-symbols-outlined text-[15px]">send</span>}
                    {sendMutation.isPending ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#64748b]">contact_support</span>
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">Contact Us</h2>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-[#6366f1]">mail</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Email</p>
                    <p className="text-[12px] font-medium text-[#0f172a] mt-0.5">info.uzairtuitionclasses@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-[#16a34a]">phone</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Phone</p>
                    <p className="text-[12px] font-medium text-[#0f172a] mt-0.5">+91 9980386446</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#fffbeb] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-[#d97706]">schedule</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Hours</p>
                    <p className="text-[12px] font-medium text-[#0f172a] mt-0.5">Mon–Fri, 9 AM – 6 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#64748b]">link</span>
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">Quick Links</h2>
                </div>
              </div>
              <div className="divide-y divide-[#f8fafc]">
                {QUICK_LINKS.map(link => (
                  <div key={link.label} className="flex items-center gap-3 px-6 py-3 hover:bg-[#fafbff] transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-[#6366f1]">{link.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#0f172a]">{link.label}</p>
                      <p className="text-[11px] text-[#94a3b8]">{link.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
