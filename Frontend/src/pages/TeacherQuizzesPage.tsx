import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

interface Batch { id: number; name: string; courseName: string; status: string; }
interface QuizSummary {
  id: number;
  title: string;
  description: string | null;
  batchId: number;
  batchName: string;
  timeLimitMinutes: number | null;
  status: string;
  questionCount: number;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#f3f4f6', text: '#6b7280' },
  PUBLISHED: { label: 'Published', bg: '#f0fdf4', text: '#16a34a' },
  CLOSED:    { label: 'Closed',    bg: '#fef2f2', text: '#dc2626' },
};

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateQuizModal({ batches, onClose, onCreated }: {
  batches: Batch[];
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?.id?.toString() ?? '');
  const [timeLimit, setTimeLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!title.trim() || !batchId) return;
    setSaving(true); setError('');
    try {
      const { data } = await api.post<QuizSummary>('/teacher/quizzes', {
        title: title.trim(),
        description: description.trim() || null,
        batchId: Number(batchId),
        timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
      });
      onCreated(data.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create quiz.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">Create Quiz</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <span className="material-symbols-outlined text-[14px]">error</span>{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Batch *</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.courseName})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Quiz"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional description…" rows={2}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Time Limit (minutes)</label>
            <input type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim() || !batchId || saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {saving ? 'Creating…' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TeacherQuizzesPage() {
  const qc = useQueryClient();
  const [batchFilter, setBatchFilter] = useState<number | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: async () => { const { data } = await api.get('/teacher/batches'); return data; },
  });

  const { data: quizzesByBatch = {}, isLoading } = useQuery<Record<number, QuizSummary[]>>({
    queryKey: ['teacher-quizzes-all', batches.map(b => b.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        batches.map(async b => {
          const { data } = await api.get<QuizSummary[]>(`/teacher/batches/${b.id}/quizzes`);
          return [b.id, data] as [number, QuizSummary[]];
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: batches.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/quizzes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-quizzes-all'] }),
  });

  const allQuizzes = useMemo(() =>
    Object.values(quizzesByBatch).flat(),
    [quizzesByBatch]
  );

  const filtered = useMemo(() =>
    batchFilter === 'ALL' ? allQuizzes : (quizzesByBatch[batchFilter as number] ?? []),
    [allQuizzes, quizzesByBatch, batchFilter]
  );

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Quizzes</h1>
            <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
              {allQuizzes.length > 0 ? `${allQuizzes.length} quiz${allQuizzes.length !== 1 ? 'zes' : ''} across your batches` : 'Create quizzes for your students'}
            </p>
          </div>
          {batches.length > 0 && (
            <button onClick={() => setShowCreate(true)}
              className="w-fit self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0f172a] text-white rounded-xl text-[12px] sm:text-sm font-medium hover:opacity-90">
              <span className="material-symbols-outlined text-[15px]">add</span>New Quiz
            </button>
          )}
        </div>

        {/* Batch filter */}
        {batches.length > 1 && (
          <div className="overflow-x-auto pb-1 mb-5">
            <div className="flex gap-1.5 min-w-max">
              <button onClick={() => setBatchFilter('ALL')}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                  batchFilter === 'ALL' ? 'bg-[#0f172a] text-white shadow-sm' : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] hover:text-[#374151]'
                }`}>
                All ({allQuizzes.length})
              </button>
              {batches.map(b => (
                <button key={b.id} onClick={() => setBatchFilter(b.id)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                    batchFilter === b.id ? 'bg-[#0f172a] text-white shadow-sm' : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] hover:text-[#374151]'
                  }`}>
                  {b.name} ({(quizzesByBatch[b.id] ?? []).length})
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading…</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <p className="text-[13px] font-medium">No batches assigned yet</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <p className="text-[13px] font-medium">No quizzes yet</p>
            <p className="text-[11px] mt-1">Click "New Quiz" to create your first quiz</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filtered.map(quiz => {
              const meta = STATUS_META[quiz.status] ?? STATUS_META.DRAFT;
              return (
                <div key={quiz.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-[#6366f1]">quiz</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f172a]">{quiz.title}</p>
                        <p className="text-[11px] text-[#94a3b8]">{quiz.batchName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.bg, color: meta.text }}>
                      {meta.label}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className="text-[11px] text-[#6b7280] line-clamp-2">{quiz.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-[#94a3b8]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">help</span>
                      {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
                    </span>
                    {quiz.timeLimitMinutes && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">timer</span>
                        {quiz.timeLimitMinutes} min
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                    <Link to={`/teacher/quizzes/${quiz.id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#eef2ff] text-[#6366f1] rounded-lg text-[11px] font-medium hover:bg-[#e0e7ff] transition-colors">
                      <span className="material-symbols-outlined text-[13px]">edit</span>Edit
                    </Link>
                    <button
                      onClick={() => { if (window.confirm('Delete this quiz?')) deleteMutation.mutate(quiz.id); }}
                      className="px-3 py-1.5 text-[#9ca3af] hover:text-[#ef4444] rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateQuizModal
          batches={batches}
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['teacher-quizzes-all'] })}
        />
      )}
    </DashboardShell>
  );
}
