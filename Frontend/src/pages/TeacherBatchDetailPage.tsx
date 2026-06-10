import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api, { apiGet } from '../lib/api';
import { BATCH_STATUS_INLINE_META } from '../lib/statusMeta';

type ActiveTab = 'students' | 'sessions' | 'announcements';

interface Batch {
  id: number;
  name: string;
  courseName: string;
  startDate: string;
  timings: string | null;
  maxStudents: number;
  status: string;
  studentCount: number;
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  enrolledAt: string;
}

interface Session {
  id: number;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string | null;
  meetingUrl: string | null;
  meetingPlatform: string;
}

interface SessionForm {
  id?: number;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  meetingPlatform: string;
}

const PLATFORM_META: Record<string, { label: string; bg: string; text: string }> = {
  GOOGLE_MEET:      { label: 'Google Meet', bg: '#ecfdf5', text: '#059669' },
  ZOOM:             { label: 'Zoom',         bg: '#eff6ff', text: '#2563eb' },
  MICROSOFT_TEAMS:  { label: 'Teams',        bg: '#eef2ff', text: '#6366f1' },
  OTHER:            { label: 'Other',         bg: '#f9fafb', text: '#6b7280' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Session Modal ─────────────────────────────────────────────────────────────
function SessionModal({ form: initial, batchId, onClose, onSaved }: {
  form: SessionForm;
  batchId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof SessionForm, v: string) => setForm(p => ({ ...p, [k]: v }));
  const isEdit = !!initial.id;

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title,
        sessionDate: form.sessionDate,
        startTime: form.startTime,
        endTime: form.endTime || null,
        meetingUrl: form.meetingUrl || null,
        meetingPlatform: form.meetingPlatform || null,
      };
      return isEdit
        ? api.put(`/admin/sessions/${initial.id}`, body)
        : api.post(`/admin/batches/${batchId}/sessions`, body);
    },
    onSuccess: () => { onSaved(); onClose(); },
  });

  const canSubmit = form.title.trim() && form.sessionDate && form.startTime && !mutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">{isEdit ? 'Edit Session' : 'New Session'}</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Trigonometry — Class 3"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Date *</label>
              <input
                type="date"
                value={form.sessionDate}
                onChange={e => set('sessionDate', e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Platform</label>
              <select
                value={form.meetingPlatform}
                onChange={e => set('meetingPlatform', e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] bg-white"
              >
                <option value="">None</option>
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="ZOOM">Zoom</option>
                <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Start Time *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => set('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => set('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Meeting Link</label>
            <input
              type="url"
              value={form.meetingUrl}
              onChange={e => set('meetingUrl', e.target.value)}
              placeholder="https://meet.google.com/…"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {isEdit ? 'Save Changes' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Announcements Tab ────────────────────────────────────────────────────────
interface Announcement {
  id: number; title: string; content: string;
  publishedByName: string | null; createdAt: string;
}

function AnnouncementsTab({ batchId }: { batchId: number }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['batch-announcements', batchId],
    queryFn: apiGet(`/teacher/batches/${batchId}/announcements`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/teacher/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batch-announcements', batchId] }),
  });

  async function handlePost() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true); setError('');
    try {
      await api.post('/teacher/announcements', { title: title.trim(), content: content.trim(), batchId });
      qc.invalidateQueries({ queryKey: ['batch-announcements', batchId] });
      setTitle(''); setContent(''); setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to post.');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] text-white rounded-xl text-[12px] font-medium hover:opacity-90">
          <span className="material-symbols-outlined text-[13px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 mb-4 space-y-3">
          {error && <p className="text-[11px] text-red-500">{error}</p>}
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *"
            className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[12px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Message *" rows={3}
            className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[12px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none" />
          <div className="flex justify-end">
            <button onClick={handlePost} disabled={!title.trim() || !content.trim() || saving}
              className="flex items-center gap-1 px-4 py-2 bg-[#6366f1] text-white rounded-xl text-[12px] font-medium hover:opacity-90 disabled:opacity-50">
              {saving && <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>}
              {saving ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#94a3b8]">
          <span className="material-symbols-outlined text-[20px] animate-spin mb-2">sync</span>
          <p className="text-[13px]">Loading…</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
          <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          <p className="text-[13px]">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0f172a]">{a.title}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    {a.publishedByName} · {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[12px] sm:text-[13px] text-[#6b7280] mt-2 whitespace-pre-wrap">{a.content}</p>
                </div>
                <button onClick={() => { if (window.confirm('Delete this announcement?')) deleteMutation.mutate(a.id); }}
                  className="text-[#9ca3af] hover:text-[#ef4444] shrink-0">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
const EMPTY: SessionForm = { title: '', sessionDate: '', startTime: '', endTime: '', meetingUrl: '', meetingPlatform: '' };

export default function TeacherBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const batchId = Number(id);

  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [sessionModal, setSessionModal] = useState<SessionForm | null>(null);

  const { data: allBatches = [], isLoading: batchLoading } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: apiGet('/teacher/batches'),
  });
  const batch = allBatches.find(b => b.id === batchId);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['teacher-batch-students', batchId],
    queryFn: apiGet(`/teacher/batches/${batchId}/students`),
    enabled: !!batchId,
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['teacher-batch-sessions', batchId],
    queryFn: apiGet(`/admin/batches/${batchId}/sessions`),
    enabled: !!batchId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['teacher-batch-sessions', batchId] });

  if (batchLoading) {
    return (
      <DashboardShell navItems={TEACHER_NAV}>
        <div className="flex items-center justify-center py-32 text-[#6b7280]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
        </div>
      </DashboardShell>
    );
  }

  if (!batch) {
    return (
      <DashboardShell navItems={TEACHER_NAV}>
        <div className="flex items-center justify-center py-32 text-[#ef4444]">
          <span className="material-symbols-outlined text-[24px] mr-2">error</span>Batch not found.
        </div>
      </DashboardShell>
    );
  }

  const statusMeta = BATCH_STATUS_INLINE_META[batch.status] ?? BATCH_STATUS_INLINE_META.COMPLETED;

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/teacher/batches')}
          className="flex items-center gap-1 text-[12px] text-[#64748b] hover:text-[#0f172a] mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          My Batches
        </button>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[18px] sm:text-xl font-bold text-[#0f172a]">{batch.name}</h1>
              <p className="text-[12px] sm:text-sm text-[#64748b] mt-0.5">{batch.courseName}</p>
            </div>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shrink-0"
              style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}>
              {batch.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] sm:text-xs text-[#64748b]">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">people</span>
              {batch.studentCount} / {batch.maxStudents} students
            </span>
            {batch.timings && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {batch.timings}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
              Started {fmtDate(batch.startDate)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto pb-1 mb-5">
          <div className="flex gap-1.5 min-w-max">
            {(['students', 'sessions', 'announcements'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all capitalize ${
                  activeTab === t ? 'bg-[#0f172a] text-white shadow-sm' : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] hover:text-[#374151]'
                }`}
              >
                {t === 'students' ? `Students (${students.length})` : t === 'sessions' ? `Sessions (${sessions.length})` : 'Announcements'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Students ── */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>people</span>
                <p className="text-[13px]">No students enrolled yet</p>
              </div>
            ) : (
              <>
                {/* Mobile list */}
                <div className="sm:hidden divide-y divide-[#f1f5f9]">
                  {students.map(s => {
                    const initials = `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
                    return (
                      <div key={s.studentId} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#eef2ff] flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-[#6366f1]">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#0f172a] truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-[11px] text-[#94a3b8] truncate">{s.email}</p>
                          {s.phone && <p className="text-[10px] text-[#94a3b8]">{s.phone}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop table */}
                <table className="hidden sm:table w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8f9fa] text-[#9ca3af] text-[11px] uppercase tracking-wide border-b border-[#e2e8f0]">
                      <th className="text-left px-5 py-3 font-semibold">Student</th>
                      <th className="text-left px-4 py-3 font-semibold">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {students.map(s => (
                      <tr key={s.studentId} className="hover:bg-[#fafbff] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-semibold text-[#0f172a]">{s.firstName} {s.lastName}</p>
                          <p className="text-[11px] text-[#94a3b8]">{s.email}</p>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-[#6b7280]">{s.phone ?? '—'}</td>
                        <td className="px-4 py-3.5 text-[12px] text-[#94a3b8] hidden md:table-cell">
                          {new Date(s.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── Sessions ── */}
        {activeTab === 'sessions' && (
          <div>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setSessionModal(EMPTY)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0f172a] text-white rounded-xl text-[12px] sm:text-sm font-medium hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Add Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] flex flex-col items-center justify-center py-16 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                <p className="text-[13px]">No sessions scheduled yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => {
                  const d = new Date(session.sessionDate);
                  const platform = PLATFORM_META[session.meetingPlatform] ?? PLATFORM_META.OTHER;
                  return (
                    <div key={session.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                      {/* Date block */}
                      <div className="shrink-0 w-12 sm:w-14 flex flex-col items-center bg-[#f1f5f9] rounded-lg py-2">
                        <span className="text-[9px] font-semibold text-[#64748b] uppercase">{MONTHS[d.getMonth()]}</span>
                        <span className="text-[18px] sm:text-xl font-bold text-[#0f172a] leading-tight">{d.getDate()}</span>
                        <span className="text-[9px] text-[#94a3b8]">{DAYS[d.getDay()]}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] sm:text-[13px] font-medium text-[#374151]">{session.title}</p>
                          {session.meetingPlatform && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: platform.bg, color: platform.text }}>
                              {platform.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">
                          {formatTime(session.startTime)}
                          {session.endTime ? ` – ${formatTime(session.endTime)}` : ''}
                        </p>
                        {session.meetingUrl && (
                          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#6366f1] hover:underline">
                            <span className="material-symbols-outlined text-[12px]">link</span>
                            Join meeting
                          </a>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/teacher/batches/${batchId}/sessions/${session.id}/attendance`}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#6366f1] bg-[#eef2ff] rounded-lg hover:bg-[#e0e7ff] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">fact_check</span>
                          <span className="hidden sm:inline">Attendance</span>
                        </Link>
                        <button
                          onClick={() => setSessionModal({
                            id: session.id,
                            title: session.title,
                            sessionDate: session.sessionDate,
                            startTime: session.startTime,
                            endTime: session.endTime ?? '',
                            meetingUrl: session.meetingUrl ?? '',
                            meetingPlatform: session.meetingPlatform ?? '',
                          })}
                          className="text-[#9ca3af] hover:text-[#374151] p-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Announcements ── */}
        {activeTab === 'announcements' && (
          <AnnouncementsTab batchId={batchId} />
        )}
      </div>

      {sessionModal !== null && (
        <SessionModal
          form={sessionModal}
          batchId={batchId}
          onClose={() => setSessionModal(null)}
          onSaved={invalidate}
        />
      )}
    </DashboardShell>
  );
}
