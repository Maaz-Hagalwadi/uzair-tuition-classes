import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

interface EnrollmentRequest {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  batchId: number;
  batchName: string;
  courseId: number;
  courseName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note: string | null;
  createdAt: string;
}

const STATUS_CFG = {
  PENDING:  { label: 'Pending',  bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' },
  APPROVED: { label: 'Approved', bg: '#f0fdf4', text: '#166534', dot: '#16a34a' },
  REJECTED: { label: 'Rejected', bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
} as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminEnrollmentPage() {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectModal, setRejectModal] = useState<{ id: number; studentName: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<EnrollmentRequest[]>({
    queryKey: ['admin-enrollment-requests', filter],
    queryFn: async () => {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/enrollment-requests${params}`);
      return data;
    },
  });

  const { data: pendingCount } = useQuery<{ count: number }>({
    queryKey: ['admin-enrollment-pending-count'],
    queryFn: async () => { const { data } = await api.get('/admin/enrollment-requests/pending-count'); return data; },
  });

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/admin/enrollment-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-enrollment-pending-count'] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      api.post(`/admin/enrollment-requests/${id}/reject`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-enrollment-pending-count'] });
      setRejectModal(null);
      setRejectNote('');
    },
  });

  const tabs: { key: typeof filter; label: string; count?: number }[] = [
    { key: 'PENDING',  label: 'Pending',  count: pendingCount?.count },
    { key: 'ALL',      label: 'All' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#070235]">
            Enrollment Requests
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            Review student requests and approve after confirming payment offline
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#f1f5f9] p-1 rounded-lg w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === t.key ? 'bg-white text-[#070235] shadow-sm' : 'text-[#64748b] hover:text-[#374151]'
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === t.key ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e2e8f0] text-[#64748b]'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#070235] text-white text-[11px] uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-semibold">Student</th>
                <th className="text-left px-5 py-3.5 font-semibold">Course / Batch</th>
                <th className="text-left px-5 py-3.5 font-semibold hidden md:table-cell">Requested</th>
                <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#94a3b8]">
                    <span className="material-symbols-outlined text-[24px] animate-spin block mx-auto mb-2">sync</span>
                    Loading…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#94a3b8]">
                    <span className="material-symbols-outlined text-[36px] block mx-auto mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
                    No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const cfg = STATUS_CFG[req.status];
                  const isApproving = approve.isPending && approve.variables === req.id;
                  return (
                    <tr key={req.id} className="hover:bg-[#fafbff] transition-colors">
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#eef2ff] flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-[#6366f1]">
                              {req.studentName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-[#0f172a]">{req.studentName}</p>
                            <p className="text-[10px] text-[#94a3b8] truncate max-w-[150px]">{req.studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Course / Batch */}
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] font-semibold text-[#0f172a]">{req.courseName}</p>
                        <p className="text-[10px] text-[#94a3b8]">{req.batchName}</p>
                      </td>

                      {/* Requested */}
                      <td className="px-5 py-3.5 hidden md:table-cell text-[11px] text-[#94a3b8]">
                        {timeAgo(req.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                        {req.note && (
                          <p className="text-[10px] text-[#94a3b8] mt-1 max-w-[160px] truncate" title={req.note}>
                            Note: {req.note}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => approve.mutate(req.id)}
                              disabled={isApproving}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] transition-colors disabled:opacity-50"
                            >
                              {isApproving
                                ? <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                                : <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectModal({ id: req.id, studentName: req.studentName }); setRejectNote(''); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[12px]">cancel</span>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#cbd5e1]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Reject modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#e2e8f0]">
              <div className="px-6 py-4 border-b border-[#f1f5f9]">
                <h3 className="text-[15px] font-bold text-[#0f172a]">Reject Request</h3>
                <p className="text-[12px] text-[#94a3b8] mt-0.5">
                  Rejecting enrollment request for <span className="font-semibold text-[#374151]">{rejectModal.studentName}</span>
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
                    Reason / Note <span className="text-[#9ca3af] font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="e.g. Batch is full, payment not confirmed…"
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setRejectModal(null)}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => reject.mutate({ id: rejectModal.id, note: rejectNote })}
                    disabled={reject.isPending}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors disabled:opacity-50"
                  >
                    {reject.isPending ? 'Rejecting…' : 'Reject Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
