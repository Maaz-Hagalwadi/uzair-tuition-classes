import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell, { type NavItem } from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { useAuthStore } from '../stores/authStore';
import { ADMIN_NAV } from '../lib/adminNav';
import { TEACHER_NAV } from '../lib/teacherNav';
import { STUDENT_NAV } from '../lib/studentNav';
import api, { apiGet } from '../lib/api';

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  TEACHER: TEACHER_NAV,
  ADMIN:   ADMIN_NAV,
};

interface TicketResponse {
  id: number; subject: string; status: string;
  studentName: string; messageCount: number;
  createdAt: string; updatedAt: string;
}
interface MessageResponse {
  id: number; senderId: number; senderName: string;
  message: string; sentAt: string; isAdmin: boolean;
}
interface ThreadResponse { ticket: TicketResponse; messages: MessageResponse[]; }

const STATUS_STYLE: Record<string, string> = {
  OPEN:        'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]',
  IN_PROGRESS: 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]',
  CLOSED:      'bg-[#f1f5f9] text-[#94a3b8] border border-[#e2e8f0]',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', CLOSED: 'Closed',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FAQS = [
  { q: 'How do I enroll in a course?', a: 'Go to Browse Courses, find a batch and click Enroll. Once payment is confirmed offline, admin will approve your request.' },
  { q: 'How do I join an online session?', a: 'Go to My Schedule and find your upcoming session. A Join button appears when a meeting link is available.' },
  { q: 'Where can I find course materials?', a: 'Open My Courses, find the course, and click the Files button in the Materials column.' },
  { q: 'How is my attendance tracked?', a: 'Your teacher marks attendance after each session. View your record on the Attendance page.' },
  { q: 'How do I change my password?', a: 'Go to Settings and use the Change Password section at the bottom.' },
];

export default function SupportPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] ?? 'STUDENT';
  const nav  = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.STUDENT;
  const qc   = useQueryClient();

  const [view, setView] = useState<'list' | 'thread' | 'new'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [reply, setReply] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: tickets = [], isLoading } = useQuery<TicketResponse[]>({
    queryKey: ['support-tickets'],
    queryFn: apiGet('/support/tickets'),
  });

  const { data: thread, isLoading: threadLoading } = useQuery<ThreadResponse>({
    queryKey: ['support-thread', selectedId],
    queryFn: apiGet(`/support/tickets/${selectedId}`),
    enabled: view === 'thread' && selectedId !== null,
  });

  const createTicket = useMutation({
    mutationFn: () => api.post('/support/tickets', { subject: newSubject.trim(), message: newMessage.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      setNewSubject(''); setNewMessage('');
      setView('list');
    },
  });

  const sendReply = useMutation({
    mutationFn: () => api.post(`/support/tickets/${selectedId}/messages`, { message: reply.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-thread', selectedId] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      setReply('');
    },
  });

  function openThread(id: number) { setSelectedId(id); setView('thread'); }

  return (
    <DashboardShell navItems={nav}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Help & Support</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Submit a ticket and we'll get back to you</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main: Tickets ── */}
          <div className="lg:col-span-2">

            {/* ── New Ticket Form ── */}
            {view === 'new' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">New Support Ticket</h2>
                  <button onClick={() => setView('list')} className="text-[#94a3b8] hover:text-[#0f172a] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Subject *</label>
                  <input value={newSubject} onChange={e => setNewSubject(e.target.value)}
                    placeholder="e.g. Issue with enrollment, payment query…"
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Message *</label>
                  <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={4}
                    placeholder="Describe your issue or question in detail…"
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                </div>
                {createTicket.isError && (
                  <p className="text-[12px] text-[#dc2626]">Failed to submit. Please try again.</p>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setView('list')}
                    className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => createTicket.mutate()}
                    disabled={!newSubject.trim() || !newMessage.trim() || createTicket.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#070235] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {createTicket.isPending
                      ? <><span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Submitting…</>
                      : <><span className="material-symbols-outlined text-[14px]">send</span> Submit Ticket</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Thread View ── */}
            {view === 'thread' && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col" style={{ minHeight: 480 }}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f1f5f9]">
                  <button onClick={() => setView('list')}
                    className="flex items-center gap-1 text-[#6366f1] hover:text-[#4f46e5] text-[12px] font-medium transition-colors">
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Back
                  </button>
                  {thread && (
                    <>
                      <span className="text-[#e2e8f0]">|</span>
                      <p className="text-[13px] font-semibold text-[#0f172a] flex-1 truncate">{thread.ticket.subject}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[thread.ticket.status] ?? STATUS_STYLE.OPEN}`}>
                        {STATUS_LABEL[thread.ticket.status] ?? thread.ticket.status}
                      </span>
                    </>
                  )}
                </div>

                {threadLoading ? (
                  <LogoSpinner py="py-12" />
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                      {thread?.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.isAdmin ? 'bg-[#f1f5f9] rounded-tl-sm' : 'bg-[#6366f1] text-white rounded-tr-sm'}`}>
                            <p className={`text-[11px] font-semibold mb-1 ${msg.isAdmin ? 'text-[#64748b]' : 'text-[#c7d2fe]'}`}>
                              {msg.isAdmin ? msg.senderName + ' (Support)' : 'You'}
                            </p>
                            <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${msg.isAdmin ? 'text-[#0f172a]' : 'text-white'}`}>{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${msg.isAdmin ? 'text-[#94a3b8]' : 'text-[#c7d2fe]'}`}>{timeAgo(msg.sentAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {thread?.ticket.status !== 'CLOSED' ? (
                      <div className="px-5 py-4 border-t border-[#f1f5f9] flex gap-3 items-end">
                        <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                          placeholder="Type your reply…"
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && reply.trim()) { e.preventDefault(); sendReply.mutate(); }}}
                          className="flex-1 px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                        <button onClick={() => sendReply.mutate()}
                          disabled={!reply.trim() || sendReply.isPending}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6366f1] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                          {sendReply.isPending
                            ? <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                            : <span className="material-symbols-outlined text-[14px]">send</span>}
                          Send
                        </button>
                      </div>
                    ) : (
                      <div className="px-5 py-3 border-t border-[#f1f5f9] text-center text-[12px] text-[#94a3b8]">
                        This ticket is closed. Reply to reopen it.
                        <div className="mt-2 flex gap-3 justify-center">
                          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                            placeholder="Add a message to reopen…"
                            className="flex-1 max-w-xs px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                          <button onClick={() => sendReply.mutate()}
                            disabled={!reply.trim() || sendReply.isPending}
                            className="flex items-center gap-1 px-3 py-2 bg-[#f1f5f9] text-[#6366f1] rounded-xl text-[12px] font-semibold hover:bg-[#e0e7ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-[13px]">refresh</span>
                            Reopen
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Ticket List ── */}
            {view === 'list' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">My Tickets</h2>
                  <button onClick={() => setView('new')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6366f1] text-white rounded-xl text-[12px] font-semibold hover:bg-[#4f46e5] transition-colors">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    New Ticket
                  </button>
                </div>

                {isLoading ? <LogoSpinner py="py-10" /> : tickets.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] py-12 flex flex-col items-center text-[#94a3b8]">
                    <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                    <p className="text-[13px] font-medium">No support tickets yet</p>
                    <p className="text-[12px] mt-1">Click "New Ticket" to get help from our team</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets.map(t => (
                      <button key={t.id} onClick={() => openThread(t.id)}
                        className="w-full bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 flex items-center gap-4 hover:bg-[#fafbff] hover:border-[#c7d2fe] transition-all text-left shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-[#eef2ff] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[17px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[13px] font-semibold text-[#0f172a] truncate">{t.subject}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                            <span>{t.messageCount} message{t.messageCount !== 1 ? 's' : ''}</span>
                            <span>·</span>
                            <span>{timeAgo(t.updatedAt)}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[t.status] ?? STATUS_STYLE.OPEN}`}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-[#c7d2fe] shrink-0">chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-6">

            {/* FAQ */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center gap-2">
                <span className="material-symbols-outlined text-[17px] text-[#64748b]">quiz</span>
                <h2 className="text-[13px] font-semibold text-[#0f172a]">FAQ</h2>
              </div>
              <div className="divide-y divide-[#f8fafc]">
                {FAQS.map((faq, i) => (
                  <div key={i}>
                    <button className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#fafbff] transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span className="text-[12px] font-medium text-[#0f172a] pr-3">{faq.q}</span>
                      <span className="material-symbols-outlined text-[16px] text-[#94a3b8] shrink-0 transition-transform duration-200"
                        style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-3.5 bg-[#fafbff]">
                        <p className="text-[11px] text-[#64748b] leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center gap-2">
                <span className="material-symbols-outlined text-[17px] text-[#64748b]">contact_support</span>
                <h2 className="text-[13px] font-semibold text-[#0f172a]">Contact</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { icon: 'mail', bg: '#eef2ff', color: '#6366f1', label: 'Email', value: 'info.uzairtuitionclasses@gmail.com' },
                  { icon: 'phone', bg: '#f0fdf4', color: '#16a34a', label: 'Phone', value: '+91 9980386446' },
                  { icon: 'schedule', bg: '#fffbeb', color: '#d97706', label: 'Hours', value: 'Mon–Fri, 9 AM – 6 PM' },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: c.color }}>{c.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">{c.label}</p>
                      <p className="text-[11px] font-medium text-[#0f172a] mt-0.5 break-all">{c.value}</p>
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
