import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api, { apiGet } from '../lib/api';

interface Batch {
  id: number;
  name: string;
  courseName: string;
  status: string;
}

interface SubmissionResponse {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  studentName: string;
  submittedAt: string;
  textAnswer: string | null;
  fileUrl: string | null;
  marksObtained: number | null;
  feedback: string | null;
  gradedAt: string | null;
  graded: boolean;
}

interface Assignment {
  id: number;
  batchId: number;
  batchName: string;
  createdByName: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxMarks: number;
  attachmentUrl: string | null;
  status: string;
  submissionCount: number;
  mySubmission: SubmissionResponse | null;
  createdAt: string;
}

const ASSIGNMENT_STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: '#f0fdf4', text: '#15803d', dot: '#16a34a' },
  CLOSED: { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Create Assignment Modal ───────────────────────────────────────────────────
function CreateAssignmentModal({ batches, onClose, onCreated }: {
  batches: Batch[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [batchId, setBatchId] = useState(batches[0]?.id?.toString() ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!title.trim() || !batchId) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/teacher/assignments', {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? dueDate : null,
        maxMarks: maxMarks ? Number(maxMarks) : 100,
        batchId: Number(batchId),
        attachmentUrl: null,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">Create Assignment</h2>
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
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.courseName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Homework"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Instructions for the assignment…" rows={3}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Due Date</label>
              <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Max Marks</label>
              <input type="number" min="1" value={maxMarks} onChange={e => setMaxMarks(e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim() || !batchId || saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {saving ? 'Creating…' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Grade Submission Modal ────────────────────────────────────────────────────
function GradeModal({ submission, maxMarks, onClose, onGraded }: {
  submission: SubmissionResponse;
  maxMarks: number;
  onClose: () => void;
  onGraded: () => void;
}) {
  const [marks, setMarks] = useState(submission.marksObtained?.toString() ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/teacher/submissions/${submission.id}/grade`, {
        marksObtained: marks ? Number(marks) : null,
        feedback: feedback.trim() || null,
      });
      onGraded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to grade submission.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">Grade Submission — {submission.studentName}</h2>
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
          {submission.textAnswer && (
            <div>
              <p className="text-xs font-semibold text-[#374151] mb-1.5">Student's Answer</p>
              <div className="px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] text-[#374151] max-h-36 overflow-y-auto">
                {submission.textAnswer}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Marks Obtained <span className="font-normal text-[#94a3b8]">(out of {maxMarks})</span>
            </label>
            <input type="number" min="0" max={maxMarks} value={marks} onChange={e => setMarks(e.target.value)}
              placeholder={`0 – ${maxMarks}`}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Feedback</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Optional feedback for the student…" rows={3}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {saving ? 'Saving…' : 'Save Grade'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherAssignmentsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<{ submission: SubmissionResponse; maxMarks: number } | null>(null);

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: apiGet('/teacher/batches'),
  });

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['teacher-assignments'],
    queryFn: apiGet('/teacher/assignments'),
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery<SubmissionResponse[]>({
    queryKey: ['teacher-assignment-submissions', expandedId],
    queryFn: apiGet(`/teacher/assignments/${expandedId}/submissions`),
    enabled: expandedId !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-assignments'] }),
  });

  function handleExpand(id: number) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">
              Assignments
            </h1>
            <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
              {assignments.length > 0
                ? `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} across your batches`
                : 'Create assignments for your students'}
            </p>
          </div>
          {batches.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-fit self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0f172a] text-white rounded-xl text-[12px] sm:text-sm font-medium hover:opacity-90">
              <span className="material-symbols-outlined text-[15px]">add</span>New Assignment
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading assignments…</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <p className="text-[13px] font-medium">No batches assigned yet</p>
            <p className="text-[11px] mt-1">You need a batch before creating assignments</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <p className="text-[13px] font-medium">No assignments yet</p>
            <p className="text-[11px] mt-1">Click "New Assignment" to create your first assignment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => {
              const meta = ASSIGNMENT_STATUS_META[a.status] ?? ASSIGNMENT_STATUS_META.ACTIVE;
              const isExpanded = expandedId === a.id;
              const isPastDue = a.dueDate ? new Date(a.dueDate) < new Date() : false;

              return (
                <div key={a.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                  {/* Assignment row */}
                  <div className="px-4 sm:px-5 py-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-[#6366f1]">assignment</span>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] sm:text-[14px] font-semibold text-[#0f172a] truncate">{a.title}</p>
                            <p className="text-[11px] text-[#94a3b8] mt-0.5">{a.batchName}</p>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: meta.bg, color: meta.text }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                            {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                          </span>
                        </div>

                        {a.description && (
                          <p className="text-[11px] text-[#6b7280] mt-1.5 line-clamp-2">{a.description}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {a.dueDate && (
                            <span className={`flex items-center gap-1 text-[11px] font-medium ${isPastDue ? 'text-[#dc2626]' : 'text-[#64748b]'}`}>
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              Due {fmtDate(a.dueDate)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-[#64748b]">
                            <span className="material-symbols-outlined text-[12px]">grade</span>
                            {a.maxMarks} marks
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-[#6366f1] font-medium">
                            <span className="material-symbols-outlined text-[12px]">group</span>
                            {a.submissionCount} submission{a.submissionCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f1f5f9]">
                      <button
                        onClick={() => handleExpand(a.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef2ff] text-[#6366f1] rounded-lg text-[11px] font-medium hover:bg-[#e0e7ff] transition-colors">
                        <span className="material-symbols-outlined text-[13px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        {isExpanded ? 'Hide Submissions' : 'View Submissions'}
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Delete this assignment?')) deleteMutation.mutate(a.id); }}
                        className="ml-auto px-2 py-1.5 text-[#9ca3af] hover:text-[#ef4444] rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Submissions panel */}
                  {isExpanded && (
                    <div className="border-t border-[#f1f5f9]">
                      {subsLoading ? (
                        <div className="flex items-center justify-center py-6 text-[#94a3b8]">
                          <span className="material-symbols-outlined text-[18px] animate-spin mr-2">sync</span>
                          <span className="text-[12px]">Loading submissions…</span>
                        </div>
                      ) : submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-[#94a3b8]">
                          <span className="material-symbols-outlined text-[24px] mb-1">inbox</span>
                          <p className="text-[12px]">No submissions yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#f8fafc]">
                          {submissions.map(sub => (
                            <div key={sub.id} className="px-4 sm:px-5 py-3 flex items-start gap-3 hover:bg-[#fafbff] transition-colors">
                              <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-[#6b7280]">
                                  {sub.studentName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[12px] font-semibold text-[#0f172a]">{sub.studentName}</p>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {sub.graded ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d]">
                                        <span className="material-symbols-outlined text-[11px]">check_circle</span>
                                        {sub.marksObtained}/{a.maxMarks}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7ed] text-[#c2410c]">
                                        Pending grade
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setGradingSubmission({ submission: sub, maxMarks: a.maxMarks })}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-[#eef2ff] text-[#6366f1] rounded-lg text-[10px] font-medium hover:bg-[#e0e7ff] transition-colors">
                                      <span className="material-symbols-outlined text-[12px]">grade</span>
                                      {sub.graded ? 'Re-grade' : 'Grade'}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-[#94a3b8] mt-0.5">Submitted {fmtDateShort(sub.submittedAt)}</p>
                                {sub.textAnswer && (
                                  <p className="text-[11px] text-[#6b7280] mt-1 line-clamp-2">{sub.textAnswer}</p>
                                )}
                                {sub.feedback && (
                                  <p className="text-[11px] text-[#6366f1] mt-1 italic">Feedback: {sub.feedback}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateAssignmentModal
          batches={batches}
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['teacher-assignments'] })}
        />
      )}

      {gradingSubmission && (
        <GradeModal
          submission={gradingSubmission.submission}
          maxMarks={gradingSubmission.maxMarks}
          onClose={() => setGradingSubmission(null)}
          onGraded={() => {
            qc.invalidateQueries({ queryKey: ['teacher-assignment-submissions', expandedId] });
            qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
          }}
        />
      )}
    </DashboardShell>
  );
}
