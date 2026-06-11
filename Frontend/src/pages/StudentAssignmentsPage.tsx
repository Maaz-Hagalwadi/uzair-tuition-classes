import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api, { apiGet } from '../lib/api';

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

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isPastDue(dueDate: string | null) {
  return dueDate ? new Date(dueDate) < new Date() : false;
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ assignment, onClose, onSubmitted }: {
  assignment: Assignment;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [textAnswer, setTextAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/student/assignments/${assignment.id}/submit`, {
        textAnswer: textAnswer.trim() || null,
        fileUrl: null,
      });
      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to submit assignment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <div className="min-w-0 pr-2">
            <h2 className="font-semibold text-[#1e1b4b] text-sm truncate">Submit Assignment</h2>
            <p className="text-[11px] text-[#94a3b8] truncate">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-[#9ca3af] hover:text-[#374151]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <span className="material-symbols-outlined text-[14px]">error</span>{error}
            </div>
          )}
          {assignment.description && (
            <div className="px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
              <p className="text-[11px] font-semibold text-[#374151] mb-1">Instructions</p>
              <p className="text-[12px] text-[#6b7280]">{assignment.description}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Your Answer</label>
            <textarea
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={5}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none"
            />
          </div>
          {assignment.dueDate && (
            <p className={`flex items-center gap-1.5 text-[11px] font-medium ${isPastDue(assignment.dueDate) ? 'text-[#dc2626]' : 'text-[#64748b]'}`}>
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Due {fmtDate(assignment.dueDate)}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentAssignmentsPage() {
  const qc = useQueryClient();
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['student-assignments'],
    queryFn: apiGet('/student/assignments'),
  });

  const pending   = assignments.filter(a => !a.mySubmission);
  const submitted = assignments.filter(a => a.mySubmission && !a.mySubmission.graded);
  const graded    = assignments.filter(a => a.mySubmission?.graded);

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">
            Assignments
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-[11px] sm:text-[13px] text-[#64748b]">
              Assignments from your enrolled batches
            </p>
            {!isLoading && assignments.length > 0 && (
              <>
                {pending.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fff7ed] text-[#c2410c]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                    {pending.length} pending
                  </span>
                )}
                {submitted.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#1d4ed8]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                    {submitted.length} awaiting grade
                  </span>
                )}
                {graded.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#15803d]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    {graded.length} graded
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[28px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading assignments…</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[30px] text-[#cbd5e1]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
            <p className="text-[15px] font-semibold text-[#374151]">No assignments yet</p>
            <p className="text-[12px] text-[#94a3b8] mt-1">Your teacher will post assignments here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => {
              const sub = a.mySubmission;
              const past = isPastDue(a.dueDate);

              return (
                <div key={a.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      sub?.graded ? 'bg-[#f0fdf4]' : sub ? 'bg-[#eff6ff]' : 'bg-[#eef2ff]'
                    }`}>
                      <span className={`material-symbols-outlined text-[18px] sm:text-[20px] ${
                        sub?.graded ? 'text-[#16a34a]' : sub ? 'text-[#3b82f6]' : 'text-[#6366f1]'
                      }`}>
                        {sub?.graded ? 'task_alt' : sub ? 'hourglass_empty' : 'assignment'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] sm:text-[14px] font-semibold text-[#0f172a]">{a.title}</p>
                          <p className="text-[11px] text-[#94a3b8] mt-0.5">{a.batchName}</p>
                        </div>
                        {/* Status badge */}
                        {sub?.graded ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d]">
                            <span className="material-symbols-outlined text-[11px]">check_circle</span>
                            {sub.marksObtained}/{a.maxMarks}
                          </span>
                        ) : sub ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eff6ff] text-[#1d4ed8]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                            Submitted
                          </span>
                        ) : past ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef2f2] text-[#dc2626]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                            Overdue
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7ed] text-[#c2410c]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                            Pending
                          </span>
                        )}
                      </div>

                      {a.description && (
                        <p className="text-[11px] text-[#6b7280] mt-1.5 line-clamp-2">{a.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {a.dueDate && (
                          <span className={`flex items-center gap-1 text-[11px] ${past && !sub ? 'text-[#dc2626] font-medium' : 'text-[#64748b]'}`}>
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            Due {fmtDate(a.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-[#64748b]">
                          <span className="material-symbols-outlined text-[12px]">grade</span>
                          {a.maxMarks} marks
                        </span>
                        {sub && (
                          <span className="flex items-center gap-1 text-[11px] text-[#64748b]">
                            <span className="material-symbols-outlined text-[12px]">upload</span>
                            Submitted {fmtDate(sub.submittedAt)}
                          </span>
                        )}
                      </div>

                      {/* Feedback if graded */}
                      {sub?.graded && sub.feedback && (
                        <div className="mt-2.5 px-3 py-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg">
                          <p className="text-[11px] font-semibold text-[#15803d] mb-0.5">Teacher's Feedback</p>
                          <p className="text-[12px] text-[#374151]">{sub.feedback}</p>
                        </div>
                      )}

                      {/* Submitted answer preview */}
                      {sub && !sub.graded && sub.textAnswer && (
                        <div className="mt-2.5 px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                          <p className="text-[11px] font-semibold text-[#6b7280] mb-0.5">Your Submission</p>
                          <p className="text-[12px] text-[#374151] line-clamp-2">{sub.textAnswer}</p>
                        </div>
                      )}

                      {/* Submit button */}
                      {!sub && (
                        <button
                          onClick={() => setSubmittingAssignment(a)}
                          disabled={past}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] text-white rounded-lg text-[11px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          <span className="material-symbols-outlined text-[13px]">upload</span>
                          {past ? 'Deadline passed' : 'Submit Assignment'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {submittingAssignment && (
        <SubmitModal
          assignment={submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ['student-assignments'] })}
        />
      )}
    </DashboardShell>
  );
}
