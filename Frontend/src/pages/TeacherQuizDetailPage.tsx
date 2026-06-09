import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

interface QuizOption { id: number; optionText: string; isCorrect: boolean | null; orderIndex: number; }
interface QuizQuestion { id: number; questionText: string; questionType: string; marks: number; orderIndex: number; options: QuizOption[]; }
interface QuizSummary {
  id: number; title: string; description: string | null; batchId: number; batchName: string;
  timeLimitMinutes: number | null; status: string; questionCount: number; createdAt: string;
}
interface QuizDetail { summary: QuizSummary; questions: QuizQuestion[]; }

interface OptionDraft { text: string; isCorrect: boolean; }

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#f3f4f6', text: '#6b7280' },
  PUBLISHED: { label: 'Published', bg: '#f0fdf4', text: '#16a34a' },
  CLOSED:    { label: 'Closed',    bg: '#fef2f2', text: '#dc2626' },
};

// ── Add Question Modal ─────────────────────────────────────────────────────────
function AddQuestionModal({ quizId, onClose, onAdded }: {
  quizId: number; onClose: () => void; onAdded: () => void;
}) {
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState('1');
  const [options, setOptions] = useState<OptionDraft[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setOptionText(i: number, text: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, text } : o));
  }
  function setCorrect(i: number) {
    setOptions(prev => prev.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  }
  function addOption() {
    setOptions(prev => [...prev, { text: '', isCorrect: false }]);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  }

  const validOptions = options.filter(o => o.text.trim());
  const hasCorrect = options.some(o => o.isCorrect && o.text.trim());
  const canSubmit = questionText.trim() && validOptions.length >= 2 && hasCorrect && !saving;

  async function handleSubmit() {
    setSaving(true); setError('');
    try {
      await api.post(`/teacher/quizzes/${quizId}/questions`, {
        questionText: questionText.trim(),
        marks: Number(marks) || 1,
        options: validOptions.map(o => ({ optionText: o.text.trim(), isCorrect: o.isCorrect })),
      });
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to add question.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">Add Question</h2>
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
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Question *</label>
            <textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
              placeholder="Enter your question…" rows={3}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none" />
          </div>
          <div className="w-28">
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Marks</label>
            <input type="number" min="1" value={marks} onChange={e => setMarks(e.target.value)}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#374151]">Options * <span className="font-normal text-[#9ca3af]">(click circle to mark correct)</span></label>
              <button onClick={addOption} className="text-xs text-[#6366f1] hover:underline">+ Add option</button>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setCorrect(i)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      opt.isCorrect ? 'border-[#6366f1] bg-[#6366f1]' : 'border-[#d1d5db]'
                    }`}>
                    {opt.isCorrect && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                  <input value={opt.text} onChange={e => setOptionText(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-1.5 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-[#9ca3af] hover:text-[#ef4444]">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!hasCorrect && validOptions.length >= 2 && (
              <p className="mt-1.5 text-xs text-[#f59e0b]">Mark one option as the correct answer</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {saving ? 'Adding…' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TeacherQuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAddQ, setShowAddQ] = useState(false);

  const quizId = Number(id);

  const { data: detail, isLoading } = useQuery<QuizDetail>({
    queryKey: ['teacher-quiz-detail', quizId],
    queryFn: async () => { const { data } = await api.get(`/teacher/quizzes/${quizId}`); return data; },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/teacher/quizzes/${quizId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-quiz-detail', quizId] }),
  });

  const deleteQuizMutation = useMutation({
    mutationFn: () => api.delete(`/teacher/quizzes/${quizId}`),
    onSuccess: () => navigate('/teacher/quizzes'),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (qId: number) => api.delete(`/teacher/questions/${qId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-quiz-detail', quizId] }),
  });

  if (isLoading || !detail) {
    return (
      <DashboardShell navItems={TEACHER_NAV}>
        <div className="flex items-center justify-center py-32 text-[#6b7280]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
        </div>
      </DashboardShell>
    );
  }

  const { summary, questions } = detail;
  const meta = STATUS_META[summary.status] ?? STATUS_META.DRAFT;

  const nextStatus = summary.status === 'DRAFT' ? 'PUBLISHED'
    : summary.status === 'PUBLISHED' ? 'CLOSED'
    : 'DRAFT';

  const nextStatusLabel = summary.status === 'DRAFT' ? 'Publish'
    : summary.status === 'PUBLISHED' ? 'Close'
    : 'Reopen';

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] mb-4">
          <Link to="/teacher/quizzes" className="hover:text-[#6366f1]">Quizzes</Link>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <span className="text-[#374151] truncate">{summary.title}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[16px] sm:text-lg font-bold text-[#0f172a]">{summary.title}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.bg, color: meta.text }}>
                  {meta.label}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">{summary.batchName}</p>
              {summary.description && <p className="text-[12px] sm:text-[13px] text-[#6b7280] mt-1">{summary.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#94a3b8]">
                <span>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                {summary.timeLimitMinutes && <span>{summary.timeLimitMinutes} min limit</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => statusMutation.mutate(nextStatus)}
                disabled={statusMutation.isPending}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                  summary.status === 'DRAFT'
                    ? 'bg-[#6366f1] text-white hover:bg-[#4f46e5]'
                    : summary.status === 'PUBLISHED'
                    ? 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0]'
                    : 'bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]'
                }`}>
                <span className="material-symbols-outlined text-[13px]">
                  {summary.status === 'DRAFT' ? 'publish' : summary.status === 'PUBLISHED' ? 'lock' : 'lock_open'}
                </span>
                {nextStatusLabel}
              </button>
              <button
                onClick={() => { if (window.confirm('Delete this quiz and all its questions?')) deleteQuizMutation.mutate(); }}
                className="px-2 py-1.5 text-[#9ca3af] hover:text-[#ef4444] rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-[#0f172a]">Questions</h2>
          <button onClick={() => setShowAddQ(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#eef2ff] text-[#6366f1] rounded-xl text-[11px] font-medium hover:bg-[#e0e7ff] transition-colors">
            <span className="material-symbols-outlined text-[13px]">add</span>Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8] bg-white rounded-2xl border border-[#e2e8f0]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
            <p className="text-[13px] font-medium">No questions yet</p>
            <p className="text-[11px] mt-1">Click "Add Question" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2.5">
                      <span className="text-[11px] font-bold text-[#94a3b8] shrink-0 mt-0.5">Q{qi + 1}</span>
                      <p className="text-[12px] sm:text-[13px] font-medium text-[#374151]">{q.questionText}</p>
                    </div>
                    <div className="space-y-1.5 pl-5">
                      {q.options.map(opt => (
                        <div key={opt.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] ${
                          opt.isCorrect ? 'bg-[#f0fdf4] text-[#16a34a] font-medium' : 'text-[#6b7280]'
                        }`}>
                          {opt.isCorrect && (
                            <span className="material-symbols-outlined text-[13px] text-[#16a34a]">check_circle</span>
                          )}
                          {!opt.isCorrect && <span className="w-3 h-3 rounded-full border border-[#d1d5db] shrink-0" />}
                          {opt.optionText}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-2 pl-5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => { if (window.confirm('Delete this question?')) deleteQuestionMutation.mutate(q.id); }}
                    className="text-[#9ca3af] hover:text-[#ef4444] shrink-0">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddQ && (
        <AddQuestionModal
          quizId={quizId}
          onClose={() => setShowAddQ(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ['teacher-quiz-detail', quizId] })}
        />
      )}
    </DashboardShell>
  );
}
