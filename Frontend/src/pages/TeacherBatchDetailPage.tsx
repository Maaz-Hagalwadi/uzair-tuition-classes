import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

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

const STATUS_META: Record<string, { bg: string; text: string }> = {
  UPCOMING:  { bg: '#eff6ff', text: '#1d4ed8' },
  ACTIVE:    { bg: '#f0fdf4', text: '#15803d' },
  COMPLETED: { bg: '#f9fafb', text: '#6b7280' },
};

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
    queryFn: async () => { const { data } = await api.get(`/teacher/batches/${batchId}/announcements`); return data; },
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
          className="flex items-center gap-1 px-3 py-1.5 bg-[#1e1b4b] text-white rounded-lg text-xs font-medium hover:opacity-90">
          <span className="material-symbols-outlined text-[13px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-[#e4e2e6] p-4 mb-4 space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *"
            className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Message *" rows={3}
            className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none" />
          <div className="flex justify-end">
            <button onClick={handlePost} disabled={!title.trim() || !content.trim() || saving}
              className="flex items-center gap-1 px-4 py-2 bg-[#6366f1] text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
              {saving && <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>}
              {saving ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-[#6b7280]">
          <span className="material-symbols-outlined text-[20px] animate-spin mr-2">sync</span>Loading…
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
          <span className="material-symbols-outlined text-[40px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          <p className="text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-[#e4e2e6] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#374151] text-sm">{a.title}</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {a.publishedByName} · {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-[#6b7280] mt-2 whitespace-pre-wrap">{a.content}</p>
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
    queryFn: async () => { const { data } = await api.get('/teacher/batches'); return data; },
  });
  const batch = allBatches.find(b => b.id === batchId);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['teacher-batch-students', batchId],
    queryFn: async () => { const { data } = await api.get(`/teacher/batches/${batchId}/students`); return data; },
    enabled: !!batchId,
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['teacher-batch-sessions', batchId],
    queryFn: async () => { const { data } = await api.get(`/admin/batches/${batchId}/sessions`); return data; },
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

  const statusMeta = STATUS_META[batch.status] ?? STATUS_META.COMPLETED;

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/teacher/batches')}
          className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1e1b4b] mb-5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          My Batches
        </button>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-[#e4e2e6] p-5 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1e1b4b]">{batch.name}</h1>
              <p className="text-sm text-[#6b7280] mt-0.5">{batch.courseName}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
              style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}>
              {batch.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#6b7280]">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">people</span>
              {batch.studentCount} / {batch.maxStudents} students
            </span>
            {batch.timings && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {batch.timings}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              Started {fmtDate(batch.startDate)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {(['students', 'sessions', 'announcements'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === t ? 'bg-[#1e1b4b] text-white' : 'text-[#6b7280] hover:bg-[#f3f4f6]'
              }`}
            >
              {t === 'students' ? `Students (${students.length})` : t === 'sessions' ? `Sessions (${sessions.length})` : 'Announcements'}
            </button>
          ))}
        </div>

        {/* ── Students ── */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl border border-[#e4e2e6]">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
                <span className="material-symbols-outlined text-[40px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>people</span>
                <p className="text-sm">No students enrolled yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f9fafb] text-[#9ca3af] text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">Student</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {students.map(s => (
                    <tr key={s.studentId} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#374151]">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-[#9ca3af]">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-[#6b7280] hidden sm:table-cell">{s.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#9ca3af] hidden md:table-cell">
                        {new Date(s.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Sessions ── */}
        {activeTab === 'sessions' && (
          <div>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setSessionModal(EMPTY)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e4e2e6] flex flex-col items-center justify-center py-16 text-[#9ca3af]">
                <span className="material-symbols-outlined text-[40px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                <p className="text-sm">No sessions scheduled yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => {
                  const d = new Date(session.sessionDate);
                  const platform = PLATFORM_META[session.meetingPlatform] ?? PLATFORM_META.OTHER;
                  return (
                    <div key={session.id} className="bg-white rounded-xl border border-[#e4e2e6] p-4 flex items-start gap-4">
                      {/* Date block */}
                      <div className="shrink-0 w-14 flex flex-col items-center bg-[#f3f4f6] rounded-lg py-2">
                        <span className="text-[10px] font-semibold text-[#6b7280] uppercase">{MONTHS[d.getMonth()]}</span>
                        <span className="text-xl font-bold text-[#1e1b4b] leading-tight">{d.getDate()}</span>
                        <span className="text-[10px] text-[#9ca3af]">{DAYS[d.getDay()]}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-[#374151] text-sm">{session.title}</p>
                          {session.meetingPlatform && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: platform.bg, color: platform.text }}>
                              {platform.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9ca3af] mt-0.5">
                          {formatTime(session.startTime)}
                          {session.endTime ? ` – ${formatTime(session.endTime)}` : ''}
                        </p>
                        {session.meetingUrl && (
                          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-[#6366f1] hover:underline">
                            <span className="material-symbols-outlined text-[12px]">link</span>
                            Join meeting
                          </a>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/teacher/batches/${batchId}/sessions/${session.id}/attendance`}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[#6366f1] bg-[#eef2ff] rounded-lg hover:bg-[#e0e7ff] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">fact_check</span>
                          Attendance
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
