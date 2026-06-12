import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { TEACHER_NAV } from '../lib/teacherNav';
import api, { apiGet } from '../lib/api';

interface Batch { id: number; name: string; courseName: string; }
interface Announcement {
  id: number; title: string; content: string;
  batchId: number | null; batchName: string | null;
  publishedByName: string | null; createdAt: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TeacherAnnouncementsPage() {
  const qc = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [batchId, setBatchId] = useState<number | ''>('');

  const { data: batches = [], isLoading: bl } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: apiGet('/teacher/batches'),
  });

  const { data: announcements = [], isLoading: al } = useQuery<Announcement[]>({
    queryKey: ['teacher-announcements', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) {
        const results = await Promise.all(
          batches.map(b => api.get<Announcement[]>(`/teacher/batches/${b.id}/announcements`).then(r => r.data))
        );
        return results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return (await api.get<Announcement[]>(`/teacher/batches/${selectedBatchId}/announcements`)).data;
    },
    enabled: batches.length > 0,
  });

  const create = useMutation({
    mutationFn: () => api.post('/teacher/announcements', {
      title: title.trim(),
      content: content.trim(),
      batchId: batchId || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-announcements'] });
      setTitle(''); setContent(''); setBatchId(''); setShowForm(false);
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-announcements'] }),
  });

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Announcements</h1>
            <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Post notices to your batch students</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#6366f1] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4f46e5] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-[#0f172a]">New Announcement</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">Batch</label>
                <select
                  value={batchId}
                  onChange={e => setBatchId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] bg-white"
                >
                  <option value="">Select a batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.courseName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Holiday on Friday"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">Message</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  placeholder="Write your announcement here…"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => create.mutate()}
                disabled={!title.trim() || !content.trim() || !batchId || create.isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#6366f1] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {create.isPending
                  ? <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                  : <span className="material-symbols-outlined text-[15px]">send</span>}
                Post Announcement
              </button>
            </div>
          </div>
        )}

        {/* Batch filter tabs */}
        {!bl && batches.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedBatchId(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                selectedBatchId === null ? 'bg-[#6366f1] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              All Batches
            </button>
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBatchId(b.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                  selectedBatchId === b.id ? 'bg-[#6366f1] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {bl || al ? (
          <LogoSpinner py="py-16" />
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            <p className="text-[13px] font-medium">No announcements yet</p>
            <p className="text-[11px] mt-1">Click "New Announcement" to post one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#eef2ff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0f172a]">{a.title}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">
                          {a.batchName && <span className="text-[#6366f1] font-medium">{a.batchName} · </span>}
                          {fmtDate(a.createdAt)} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => del.mutate(a.id)}
                        disabled={del.isPending}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    <p className="text-[13px] text-[#6b7280] mt-2 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
