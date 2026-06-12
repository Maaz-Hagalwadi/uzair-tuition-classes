import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { ADMIN_NAV } from '../lib/adminNav';
import api, { apiGet } from '../lib/api';

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

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

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

export default function AdminSupportPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState('');

  const { data: tickets = [], isLoading } = useQuery<TicketResponse[]>({
    queryKey: ['admin-support-tickets'],
    queryFn: apiGet('/admin/support/tickets'),
    refetchInterval: 30000,
  });

  const { data: thread, isLoading: threadLoading } = useQuery<ThreadResponse>({
    queryKey: ['admin-support-thread', selectedId],
    queryFn: apiGet(`/support/tickets/${selectedId}`),
    enabled: selectedId !== null,
  });

  const sendReply = useMutation({
    mutationFn: () => api.post(`/support/tickets/${selectedId}/messages`, { message: reply.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-support-thread', selectedId] });
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      setReply('');
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.put(`/admin/support/tickets/${selectedId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-support-thread', selectedId] });
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });

  const filtered = tickets.filter(t => filter === 'ALL' || t.status === filter);

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
  };

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Support Inbox</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Manage and respond to student and teacher support tickets</p>
        </div>

        {selectedId === null ? (
          <>
            {/* Filter tabs */}
            <div className="flex gap-1 mb-4 bg-[#f1f5f9] rounded-xl p-1 w-fit">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${filter === s ? 'bg-white text-[#070235] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
                  {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-[#6366f1] text-white' : 'bg-[#e2e8f0] text-[#64748b]'}`}>
                    {counts[s]}
                  </span>
                </button>
              ))}
            </div>

            {isLoading ? <LogoSpinner py="py-16" /> : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                <p className="text-[13px]">{filter === 'ALL' ? 'No support tickets yet' : `No ${STATUS_LABEL[filter]?.toLowerCase()} tickets`}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                {/* Desktop table */}
                <table className="hidden sm:table w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8f9fa] text-[#9ca3af] text-[11px] uppercase tracking-wide border-b border-[#e2e8f0]">
                      <th className="text-left px-5 py-3 font-semibold">Student</th>
                      <th className="text-left px-4 py-3 font-semibold">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Messages</th>
                      <th className="text-left px-4 py-3 font-semibold">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map(t => (
                      <tr key={t.id} onClick={() => setSelectedId(t.id)}
                        className="hover:bg-[#fafbff] transition-colors cursor-pointer">
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-semibold text-[#0f172a]">{t.studentName}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[12px] text-[#374151]">{t.subject}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] ?? STATUS_STYLE.OPEN}`}>
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-[#64748b]">{t.messageCount}</td>
                        <td className="px-4 py-3.5 text-[12px] text-[#94a3b8]">{timeAgo(t.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile list */}
                <div className="sm:hidden divide-y divide-[#f1f5f9]">
                  {filtered.map(t => (
                    <button key={t.id} onClick={() => setSelectedId(t.id)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-[#fafbff] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[17px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0f172a] truncate">{t.studentName}</p>
                        <p className="text-[11px] text-[#64748b] truncate">{t.subject}</p>
                        <p className="text-[10px] text-[#94a3b8] mt-0.5">{t.messageCount} msg · {timeAgo(t.updatedAt)}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[t.status] ?? STATUS_STYLE.OPEN}`}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Thread View ── */
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col" style={{ minHeight: 520 }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f1f5f9] flex-wrap gap-y-2">
              <button onClick={() => { setSelectedId(null); setReply(''); }}
                className="flex items-center gap-1 text-[#6366f1] hover:text-[#4f46e5] text-[12px] font-medium transition-colors shrink-0">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back
              </button>
              {thread && (
                <>
                  <span className="text-[#e2e8f0]">|</span>
                  <p className="text-[13px] font-semibold text-[#0f172a] flex-1 truncate min-w-0">{thread.ticket.subject}</p>
                  <p className="text-[11px] text-[#64748b] shrink-0">from {thread.ticket.studentName}</p>
                  {/* Status selector */}
                  <select value={thread.ticket.status}
                    onChange={e => updateStatus.mutate(e.target.value)}
                    disabled={updateStatus.isPending}
                    className="px-2.5 py-1.5 border border-[#e2e8f0] rounded-lg text-[11px] font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 cursor-pointer shrink-0">
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </>
              )}
            </div>

            {threadLoading ? <LogoSpinner py="py-12" /> : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {thread?.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.isAdmin ? 'bg-[#6366f1] text-white rounded-tr-sm' : 'bg-[#f1f5f9] rounded-tl-sm'}`}>
                        <p className={`text-[11px] font-semibold mb-1 ${msg.isAdmin ? 'text-[#c7d2fe]' : 'text-[#64748b]'}`}>
                          {msg.isAdmin ? 'You (Support)' : msg.senderName}
                        </p>
                        <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${msg.isAdmin ? 'text-white' : 'text-[#0f172a]'}`}>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.isAdmin ? 'text-[#c7d2fe]' : 'text-[#94a3b8]'}`}>{timeAgo(msg.sentAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>

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
                    Send Reply
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
