import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api, { apiGet } from '../lib/api';
import { BATCH_STATUS_META } from '../lib/statusMeta';

type ActiveTab = 'students' | 'sessions' | 'fees';

interface BatchEditForm {
  name: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  timings: string;
  maxStudents: string;
  status: string;
}

interface Batch {
  id: number; name: string; courseId: number; courseName: string;
  teacherId: number | null; teacherName: string | null;
  startDate: string; endDate: string | null; timings: string | null;
  maxStudents: number; status: string; studentCount: number;
}

interface Student {
  studentId: number; firstName: string; lastName: string;
  email: string; phone: string | null; enrolledAt: string;
}

interface AllStudent {
  id: number; firstName: string; lastName: string; email: string;
}

interface Session {
  id: number; batchId: number; batchName: string; courseName: string;
  title: string; sessionDate: string; startTime: string; endTime: string | null;
  meetingUrl: string | null; meetingPlatform: string | null; createdByName: string | null;
}

interface SessionForm {
  title: string; sessionDate: string; startTime: string;
  endTime: string; meetingUrl: string; meetingPlatform: string;
}

interface FeeStructure {
  id: number;
  batchId: number;
  feeType: string;
  amount: number;
  description: string | null;
  dueDay: number | null;
}

interface FeeForm {
  feeType: string;
  amount: string;
  description: string;
  dueDay: string;
}

const EMPTY_SESSION: SessionForm = {
  title: '', sessionDate: '', startTime: '', endTime: '', meetingUrl: '', meetingPlatform: 'GOOGLE_MEET',
};

const EMPTY_FEE_FORM: FeeForm = {
  feeType: 'MONTHLY', amount: '', description: '', dueDay: '',
};

const PLATFORMS: { value: string; label: string; icon: string }[] = [
  { value: 'GOOGLE_MEET', label: 'Google Meet', icon: 'video_call' },
  { value: 'ZOOM', label: 'Zoom', icon: 'videocam' },
  { value: 'MICROSOFT_TEAMS', label: 'Teams', icon: 'groups' },
  { value: 'OTHER', label: 'Other', icon: 'link' },
];

function platformLabel(p: string | null) {
  return PLATFORMS.find(x => x.value === p)?.label ?? p ?? 'Link';
}

function ConfirmModal({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">delete</span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#131b2e]">Confirm Delete</p>
            <p className="text-[12px] text-[#505f76] mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-[13px] border border-[#c8c5d0] text-[#505f76] rounded-lg font-semibold hover:bg-[#f2f3ff] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] bg-[#ba1a1a] text-white rounded-lg font-semibold hover:bg-[#93000a] transition-colors disabled:opacity-60">
            {loading && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionModal({
  initial, onClose, onSave, saving,
}: {
  initial: SessionForm & { id?: number };
  onClose: () => void;
  onSave: (f: SessionForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<SessionForm>({ ...initial });
  const set = (k: keyof SessionForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2e6]">
          <h2 className="font-semibold text-[#131b2e]">{isEdit ? 'Edit Session' : 'New Session'}</h2>
          <button onClick={onClose} className="text-[#787680] hover:text-[#131b2e]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">Title *</label>
            <input required type="text" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra"
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">Date *</label>
              <input required type="date" value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">Start *</label>
              <input required type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                End <span className="font-normal text-[#787680]">(opt.)</span>
              </label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} type="button" onClick={() => set('meetingPlatform', p.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    form.meetingPlatform === p.value
                      ? 'border-[#070235] bg-[#eaedff] text-[#070235]'
                      : 'border-[#c8c5d0] text-[#505f76] hover:bg-[#f2f3ff]'
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">
              Meeting Link <span className="font-normal text-[#787680]">(optional)</span>
            </label>
            <input type="url" value={form.meetingUrl} onChange={e => set('meetingUrl', e.target.value)}
              placeholder="https://meet.google.com/…"
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-sm font-semibold hover:bg-[#f2f3ff] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60">
              {saving && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkEnrollModal({
  batchId,
  allStudents,
  enrolledIds,
  onClose,
  onSuccess,
}: {
  batchId: number;
  allStudents: AllStudent[];
  enrolledIds: Set<number>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const available = allStudents.filter(s => !enrolledIds.has(s.id));
  const filtered = available.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (filtered.every(s => selected.has(s.id))) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const bulkMutation = useMutation({
    mutationFn: (ids: number[]) =>
      api.post(`/admin/batches/${batchId}/students/bulk`, { studentIds: ids }),
    onSuccess: () => {
      setSuccessMsg(`${selected.size} student(s) enrolled successfully.`);
      setError('');
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? 'Failed to bulk enroll students.');
    },
  });

  const handleEnroll = () => {
    if (selected.size === 0) return;
    setError('');
    bulkMutation.mutate(Array.from(selected));
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2e6] shrink-0">
          <div>
            <h2 className="font-semibold text-[#131b2e]">Bulk Enroll Students</h2>
            <p className="text-[12px] text-[#787680] mt-0.5">{available.length} student(s) available to enroll</p>
          </div>
          <button onClick={onClose} className="text-[#787680] hover:text-[#131b2e]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#e4e2e6] shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#787680]">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
            />
          </div>
        </div>

        {/* Select-all row */}
        {filtered.length > 0 && (
          <div
            className="flex items-center gap-3 px-6 py-2.5 border-b border-[#e4e2e6] bg-[#faf8ff] cursor-pointer shrink-0"
            onClick={toggleAll}
          >
            <input
              type="checkbox" readOnly
              checked={allFilteredSelected}
              className="w-4 h-4 rounded accent-[#070235] cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#505f76]">
              {allFilteredSelected ? 'Deselect all' : `Select all (${filtered.length})`}
            </span>
          </div>
        )}

        {/* Student list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#e4e2e6]">
          {available.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#c8c5d0] mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
              <p className="text-sm text-[#787680]">All students are already enrolled in this batch.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-[#c8c5d0] mb-2">search_off</span>
              <p className="text-sm text-[#787680]">No students match your search.</p>
            </div>
          ) : (
            filtered.map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                  selected.has(s.id) ? 'bg-[#f0f2ff]' : 'hover:bg-[#faf8ff]'
                }`}
                onClick={() => toggleSelect(s.id)}
              >
                <input
                  type="checkbox" readOnly checked={selected.has(s.id)}
                  className="w-4 h-4 rounded accent-[#070235] shrink-0 cursor-pointer"
                />
                <div className="w-8 h-8 rounded-full bg-[#eaedff] flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-[#070235]">
                    {s.firstName[0]}{s.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#131b2e] truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-[#787680] truncate">{s.email}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e4e2e6] shrink-0">
          {error && (
            <p className="flex items-center gap-1 text-xs text-[#ba1a1a] mb-3">
              <span className="material-symbols-outlined text-[14px]">error</span>{error}
            </p>
          )}
          {successMsg && (
            <p className="flex items-center gap-1 text-xs text-green-700 mb-3">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>{successMsg}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-sm font-semibold hover:bg-[#f2f3ff] transition-colors">
              {successMsg ? 'Close' : 'Cancel'}
            </button>
            {!successMsg && (
              <button
                onClick={handleEnroll}
                disabled={selected.size === 0 || bulkMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50"
              >
                {bulkMutation.isPending && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                )}
                {bulkMutation.isPending
                  ? 'Enrolling…'
                  : `Enroll Selected (${selected.size})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t: string | null) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function AdminBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const batchId = Number(id);

  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [sessionModal, setSessionModal] = useState<null | (SessionForm & { id?: number })>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<BatchEditForm>({ name: '', teacherId: '', startDate: '', endDate: '', timings: '', maxStudents: '30', status: 'UPCOMING' });
  const [editError, setEditError] = useState('');
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);

  // Fee structure state
  const [feeForm, setFeeForm] = useState<FeeForm>(EMPTY_FEE_FORM);
  const [feeFormOpen, setFeeFormOpen] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [generateMsg, setGenerateMsg] = useState('');

  const { data: batch, isLoading: batchLoading } = useQuery<Batch>({
    queryKey: ['admin-batch', batchId],
    queryFn: apiGet(`/admin/batches/${batchId}`),
    enabled: !!batchId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['admin-batch-students', batchId],
    queryFn: apiGet(`/admin/batches/${batchId}/students`),
    enabled: !!batchId,
  });

  const { data: allStudents = [] } = useQuery<AllStudent[]>({
    queryKey: ['students-list'],
    queryFn: apiGet('/admin/users?role=STUDENT'),
  });

  const { data: teachers = [] } = useQuery<AllStudent[]>({
    queryKey: ['teachers-list'],
    queryFn: apiGet('/admin/users?role=TEACHER'),
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['admin-batch-sessions', batchId],
    queryFn: apiGet(`/admin/batches/${batchId}/sessions`),
    enabled: !!batchId,
  });

  const { data: feeStructure, isLoading: feeLoading } = useQuery<FeeStructure>({
    queryKey: ['admin-batch-fee', batchId],
    queryFn: async () => {
      try {
        const res = await api.get(`/admin/batches/${batchId}/fee-structure`);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!batchId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-batch-students', batchId] });
    qc.invalidateQueries({ queryKey: ['admin-batch', batchId] });
    qc.invalidateQueries({ queryKey: ['admin-batches'] });
  };

  const invalidateSessions = () => qc.invalidateQueries({ queryKey: ['admin-batch-sessions', batchId] });

  const invalidateFee = () => qc.invalidateQueries({ queryKey: ['admin-batch-fee', batchId] });

  const enrollMutation = useMutation({
    mutationFn: (studentId: number) =>
      api.post(`/admin/batches/${batchId}/students?studentId=${studentId}`),
    onSuccess: () => { invalidate(); setSelectedStudentId(''); setEnrollError(''); },
    onError: (err: any) => setEnrollError(err.response?.data?.message ?? 'Failed to enrol student.'),
  });

  const removeMutation = useMutation({
    mutationFn: (studentId: number) => api.delete(`/admin/batches/${batchId}/students/${studentId}`),
    onSuccess: () => { invalidate(); setConfirmModal(null); },
  });

  const createSessionMutation = useMutation({
    mutationFn: (f: SessionForm) => api.post(`/admin/batches/${batchId}/sessions`, {
      title: f.title,
      sessionDate: f.sessionDate,
      startTime: f.startTime,
      endTime: f.endTime || null,
      meetingUrl: f.meetingUrl || null,
      meetingPlatform: f.meetingPlatform || null,
    }),
    onSuccess: () => { invalidateSessions(); setSessionModal(null); },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, f }: { id: number; f: SessionForm }) => api.put(`/admin/sessions/${id}`, {
      title: f.title,
      sessionDate: f.sessionDate,
      startTime: f.startTime,
      endTime: f.endTime || null,
      meetingUrl: f.meetingUrl || null,
      meetingPlatform: f.meetingPlatform || null,
    }),
    onSuccess: () => { invalidateSessions(); setSessionModal(null); },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => api.delete(`/admin/sessions/${sessionId}`),
    onSuccess: () => { invalidateSessions(); setConfirmModal(null); },
  });

  const updateBatchMutation = useMutation({
    mutationFn: (form: BatchEditForm) => api.put(`/admin/batches/${batchId}`, {
      name: form.name.trim(),
      courseId: batch!.courseId ?? batch!.id,
      teacherId: form.teacherId ? Number(form.teacherId) : null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      timings: form.timings.trim() || null,
      maxStudents: Number(form.maxStudents) || 30,
      status: form.status,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batch', batchId] });
      qc.invalidateQueries({ queryKey: ['admin-batches'] });
      setEditModal(false); setEditError('');
    },
    onError: (err: any) => setEditError(err.response?.data?.message ?? 'Failed to save changes.'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/admin/batches/${batchId}`, {
      name: batch!.name, courseId: batch!.courseId ?? batch!.id,
      teacherId: batch!.teacherId ?? null,
      startDate: batch!.startDate, endDate: batch!.endDate ?? null,
      timings: batch!.timings ?? null, maxStudents: batch!.maxStudents, status,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-batch', batchId] }); qc.invalidateQueries({ queryKey: ['admin-batches'] }); },
  });

  const saveFeeStructureMutation = useMutation({
    mutationFn: (form: FeeForm) => api.put(`/admin/batches/${batchId}/fee-structure`, {
      feeType: form.feeType,
      amount: parseFloat(form.amount),
      description: form.description || null,
      dueDay: form.feeType === 'MONTHLY' && form.dueDay ? parseInt(form.dueDay) : null,
    }),
    onSuccess: () => {
      invalidateFee();
      setFeeFormOpen(false);
      setFeeError('');
    },
    onError: (err: any) => setFeeError(err.response?.data?.message ?? 'Failed to save fee structure.'),
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: () => api.post(`/admin/batches/${batchId}/fee-structure/generate`),
    onSuccess: (res) => {
      const data = res.data as { created: number; message: string };
      setGenerateMsg(data.message);
    },
    onError: (err: any) => setGenerateMsg(err.response?.data?.message ?? 'Failed to generate payments.'),
  });

  const handleSessionSave = (f: SessionForm) => {
    if (sessionModal?.id) updateSessionMutation.mutate({ id: sessionModal.id, f });
    else createSessionMutation.mutate(f);
  };

  const enrolledIds = new Set(students.map(s => s.studentId));
  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id));

  if (batchLoading) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex items-center justify-center py-32 text-[#787680]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
        </div>
      </DashboardShell>
    );
  }

  if (!batch) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex items-center justify-center py-32 text-[#93000a]">
          <span className="material-symbols-outlined text-[24px] mr-2">error</span>Batch not found.
        </div>
      </DashboardShell>
    );
  }

  const statusMeta = BATCH_STATUS_META[batch.status] ?? BATCH_STATUS_META.COMPLETED;

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <button onClick={() => navigate('/admin/batches')}
          className="flex items-center gap-1 text-sm text-[#505f76] hover:text-[#070235] mb-6 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Batches
        </button>

        {/* Batch header */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
            <div>
              <h1 className="font-serif text-[18px] sm:text-[24px] font-semibold text-[#070235]">{batch.name}</h1>
              <p className="text-[12px] sm:text-sm text-[#505f76] mt-0.5">{batch.courseName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {/* Quick status pills */}
              <div className="flex gap-1">
                {(['UPCOMING', 'ACTIVE', 'COMPLETED'] as const).map(s => (
                  <button key={s} onClick={() => { if (batch.status !== s) statusMutation.mutate(s); }}
                    disabled={statusMutation.isPending}
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all ${
                      batch.status === s
                        ? `${statusMeta.bg} ${statusMeta.text} ring-1 ring-current/30`
                        : 'bg-[#f2f3ff] text-[#505f76] hover:bg-[#eaedff]'
                    }`}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setEditForm({
                    name: batch.name,
                    teacherId: batch.teacherId ? String(batch.teacherId) : '',
                    startDate: batch.startDate,
                    endDate: batch.endDate ?? '',
                    timings: batch.timings ?? '',
                    maxStudents: String(batch.maxStudents),
                    status: batch.status,
                  });
                  setEditModal(true); setEditError('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-semibold hover:bg-[#f2f3ff] transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: 'person', label: 'Teacher', value: batch.teacherName ?? 'Unassigned' },
              { icon: 'calendar_today', label: 'Start Date', value: formatDate(batch.startDate) },
              { icon: 'schedule', label: 'Timings', value: batch.timings ?? '—' },
              { icon: 'group', label: 'Students', value: `${batch.studentCount} / ${batch.maxStudents}` },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-[#505f76] mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-[10px] sm:text-xs text-[#787680]">{item.label}</p>
                  <p className="text-[12px] sm:text-sm font-medium text-[#131b2e]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#f2f3ff] p-1 rounded-xl w-fit flex-wrap">
          {([
            { key: 'students', icon: 'group', label: 'Students', count: batch.studentCount },
            { key: 'sessions', icon: 'video_call', label: 'Sessions', count: sessions.length },
            { key: 'fees', icon: 'payments', label: 'Fees', count: null },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[#070235] shadow-sm'
                  : 'text-[#505f76] hover:text-[#070235]'
              }`}>
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-[#eaedff] text-[#070235]' : 'bg-white/60 text-[#787680]'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Students tab */}
        {activeTab === 'students' && (
          <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e4e2e6]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] sm:text-sm font-semibold text-[#131b2e] flex items-center gap-1.5 sm:gap-2">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#505f76]">group</span>
                  Enrolled Students
                  <span className="ml-1 px-2 py-0.5 bg-[#eaedff] text-[#070235] rounded-full text-[11px] sm:text-xs font-medium">
                    {batch.studentCount}
                  </span>
                </h2>
                <button
                  onClick={() => setBulkEnrollOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-semibold hover:bg-[#f2f3ff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">group_add</span>
                  Bulk Enroll
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-[#070235] mb-1">Add Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => { setSelectedStudentId(e.target.value); setEnrollError(''); }}
                    className="block w-full px-3 py-2 sm:py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm focus:outline-none focus:border-[#070235] transition-all"
                  >
                    <option value="">Select a student…</option>
                    {availableStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.email}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { if (selectedStudentId) enrollMutation.mutate(Number(selectedStudentId)); }}
                  disabled={!selectedStudentId || enrollMutation.isPending}
                  className="w-fit self-end sm:self-auto flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#070235] text-white rounded-lg text-[12px] sm:text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50"
                >
                  {enrollMutation.isPending
                    ? <span className="material-symbols-outlined text-[14px] sm:text-[16px] animate-spin">sync</span>
                    : <span className="material-symbols-outlined text-[14px] sm:text-[16px]">person_add</span>}
                  Enrol
                </button>
              </div>
              {enrollError && (
                <p className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[13px] sm:text-[14px]">error</span>{enrollError}
                </p>
              )}
            </div>

            {students.length > 0 && (
              <div className="px-4 sm:px-6 py-3 border-b border-[#e4e2e6]">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#787680]">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">search</span>
                  </span>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search students…"
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm focus:outline-none focus:border-[#070235] transition-all" />
                </div>
              </div>
            )}

            {studentsLoading ? (
              <div className="flex items-center justify-center py-12 text-[#787680]">
                <span className="material-symbols-outlined text-[20px] animate-spin mr-2">sync</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-[40px] text-[#c8c5d0] mb-2"
                  style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
                <p className="text-[12px] sm:text-sm text-[#787680]">
                  {search ? 'No students match your search.' : 'No students enrolled yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-[#e4e2e6]">
                  {filteredStudents.map(s => (
                    <div key={s.studentId} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#eaedff] flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-semibold text-[#070235]">{s.firstName[0]}{s.lastName[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#131b2e] truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-[10px] text-[#787680] truncate">{s.email}</p>
                        {s.phone && <p className="text-[10px] text-[#787680]">{s.phone}</p>}
                      </div>
                      <button onClick={() => setConfirmModal({ message: `Remove ${s.firstName} ${s.lastName} from this batch?`, onConfirm: () => removeMutation.mutate(s.studentId) })}
                        className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[15px]">person_remove</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <table className="hidden sm:table w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e4e2e6] bg-[#faf8ff]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Student</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Phone</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Enrolled</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e2e6]">
                    {filteredStudents.map(s => (
                      <tr key={s.studentId} className="hover:bg-[#faf8ff] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#eaedff] flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-[#070235]">{s.firstName[0]}{s.lastName[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-[#131b2e]">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-[#787680]">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#505f76] text-xs">{s.phone ?? '—'}</td>
                        <td className="px-5 py-3.5 text-[#505f76] text-xs">{formatDate(s.enrolledAt)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <button onClick={() => setConfirmModal({ message: `Remove ${s.firstName} ${s.lastName} from this batch?`, onConfirm: () => removeMutation.mutate(s.studentId) })}
                              className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                              title="Remove from batch">
                              <span className="material-symbols-outlined text-[16px]">person_remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e4e2e6]">
              <h2 className="text-[13px] sm:text-sm font-semibold text-[#131b2e] flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#505f76]">video_call</span>
                Class Sessions
                <span className="ml-1 px-2 py-0.5 bg-[#eaedff] text-[#070235] rounded-full text-[11px] sm:text-xs font-medium">
                  {sessions.length}
                </span>
              </h2>
              <button onClick={() => setSessionModal({ ...EMPTY_SESSION })}
                className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-[#070235] text-white rounded-lg text-[10px] sm:text-sm font-semibold hover:bg-[#1e1b4b] transition-colors">
                <span className="material-symbols-outlined text-[12px] sm:text-[16px]">add</span>
                Add Session
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12 text-[#787680]">
                <span className="material-symbols-outlined text-[20px] animate-spin mr-2">sync</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-[48px] text-[#c8c5d0] mb-3"
                  style={{ fontVariationSettings: "'FILL' 1" }}>video_call</span>
                <p className="text-sm font-medium text-[#131b2e] mb-1">No sessions yet</p>
                <p className="text-xs text-[#787680]">Add a class session with a meeting link for students.</p>
              </div>
            ) : (
              <>
              {/* Mobile cards */}
              <div className="sm:hidden p-3 space-y-3">
                {sessions.map(s => {
                  const plat = PLATFORMS.find(p => p.value === s.meetingPlatform);
                  return (
                    <div key={s.id} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                      {/* Card body */}
                      <div className="flex items-stretch">
                        {/* Date column */}
                        <div className="w-14 bg-[#070235] flex flex-col items-center justify-center py-3 shrink-0">
                          <p className="text-[9px] font-semibold text-[#a5b4fc] uppercase tracking-wide">
                            {new Date(s.sessionDate).toLocaleDateString('en-GB', { month: 'short' })}
                          </p>
                          <p className="text-[22px] font-bold text-white leading-none">
                            {new Date(s.sessionDate).getDate()}
                          </p>
                          <p className="text-[9px] text-[#a5b4fc]">
                            {new Date(s.sessionDate).toLocaleDateString('en-GB', { weekday: 'short' })}
                          </p>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 p-3">
                          <p className="text-[13px] font-semibold text-[#131b2e] leading-snug">{s.title}</p>
                          <p className="text-[11px] text-[#505f76] mt-0.5">
                            {formatTime(s.startTime)}{s.endTime ? ` — ${formatTime(s.endTime)}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {plat && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#eaedff] text-[#070235] rounded-full text-[10px] font-medium">
                                <span className="material-symbols-outlined text-[11px]">{plat.icon}</span>
                                {plat.label}
                              </span>
                            )}
                            {s.meetingUrl && (
                              <a href={s.meetingUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#4f46e5] font-medium hover:underline">
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                Join
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Action row */}
                      <div className="flex items-center gap-1 px-3 py-2 bg-[#fafbff] border-t border-[#e2e8f0]">
                        <button
                          onClick={() => navigate(`/admin/batches/${batchId}/sessions/${s.id}/attendance`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#4f46e5] bg-[#eef2ff] rounded-lg"
                        >
                          <span className="material-symbols-outlined text-[13px]">fact_check</span>
                          Attendance
                        </button>
                        <div className="ml-auto flex items-center gap-1">
                          <button onClick={() => setSessionModal({
                            id: s.id, title: s.title, sessionDate: s.sessionDate,
                            startTime: s.startTime, endTime: s.endTime ?? '',
                            meetingUrl: s.meetingUrl ?? '', meetingPlatform: s.meetingPlatform ?? 'GOOGLE_MEET',
                          })} className="p-1.5 text-[#787680] hover:text-[#070235] hover:bg-[#eaedff] rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button onClick={() => setConfirmModal({ message: `Delete session "${s.title}"?`, onConfirm: () => deleteSessionMutation.mutate(s.id) })}
                            className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop rows */}
              <div className="hidden sm:block divide-y divide-[#e4e2e6]">
                {sessions.map(s => {
                  const plat = PLATFORMS.find(p => p.value === s.meetingPlatform);
                  return (
                    <div key={s.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[#faf8ff] transition-colors">
                      <div className="shrink-0 w-12 text-center">
                        <p className="text-[10px] font-semibold text-[#787680] uppercase tracking-wide">
                          {new Date(s.sessionDate).toLocaleDateString('en-GB', { month: 'short' })}
                        </p>
                        <p className="text-xl font-bold text-[#070235] leading-none">
                          {new Date(s.sessionDate).getDate()}
                        </p>
                        <p className="text-[10px] text-[#787680]">
                          {new Date(s.sessionDate).toLocaleDateString('en-GB', { weekday: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-[#131b2e] text-sm">{s.title}</p>
                          {plat && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#eaedff] text-[#070235] rounded-full text-[10px] font-medium">
                              <span className="material-symbols-outlined text-[11px]">{plat.icon}</span>
                              {plat.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#505f76]">
                          {formatTime(s.startTime)}{s.endTime ? ` — ${formatTime(s.endTime)}` : ''}
                          {s.createdByName ? ` · Added by ${s.createdByName}` : ''}
                        </p>
                        {s.meetingUrl && (
                          <a href={s.meetingUrl} target="_blank" rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#070235] font-medium hover:underline">
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            {platformLabel(s.meetingPlatform)} Link
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => navigate(`/admin/batches/${batchId}/sessions/${s.id}/attendance`)}
                          className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-[#4f46e5] hover:bg-[#eef2ff] rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[14px]">fact_check</span>
                          Attendance
                        </button>
                        <button onClick={() => setSessionModal({
                          id: s.id, title: s.title, sessionDate: s.sessionDate,
                          startTime: s.startTime, endTime: s.endTime ?? '',
                          meetingUrl: s.meetingUrl ?? '', meetingPlatform: s.meetingPlatform ?? 'GOOGLE_MEET',
                        })} className="p-1.5 text-[#787680] hover:text-[#070235] hover:bg-[#eaedff] rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => setConfirmModal({ message: `Delete session "${s.title}"?`, onConfirm: () => deleteSessionMutation.mutate(s.id) })}
                          className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>
        )}

        {/* Fees tab */}
        {activeTab === 'fees' && (
          <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e4e2e6]">
              <h2 className="text-[13px] sm:text-sm font-semibold text-[#131b2e] flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#505f76]">payments</span>
                Fee Structure
              </h2>
              {feeStructure && !feeFormOpen && (
                <button
                  onClick={() => {
                    setFeeForm({
                      feeType: feeStructure.feeType,
                      amount: String(feeStructure.amount),
                      description: feeStructure.description ?? '',
                      dueDay: feeStructure.dueDay != null ? String(feeStructure.dueDay) : '',
                    });
                    setFeeFormOpen(true);
                    setFeeError('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-semibold hover:bg-[#f2f3ff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit
                </button>
              )}
            </div>

            <div className="p-4 sm:p-6">
              {feeLoading ? (
                <div className="flex items-center justify-center py-12 text-[#787680]">
                  <span className="material-symbols-outlined text-[20px] animate-spin mr-2">sync</span>
                </div>
              ) : !feeStructure && !feeFormOpen ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-[#c8c5d0] mb-3"
                    style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  <p className="text-sm font-medium text-[#131b2e] mb-1">No fee structure set</p>
                  <p className="text-xs text-[#787680] mb-4">Configure fees for this batch to generate payment records for enrolled students.</p>
                  <button
                    onClick={() => { setFeeForm(EMPTY_FEE_FORM); setFeeFormOpen(true); setFeeError(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Set Fee Structure
                  </button>
                </div>
              ) : feeFormOpen ? (
                /* Fee structure form */
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!feeForm.amount || isNaN(parseFloat(feeForm.amount)) || parseFloat(feeForm.amount) <= 0) {
                      setFeeError('Please enter a valid positive amount.');
                      return;
                    }
                    saveFeeStructureMutation.mutate(feeForm);
                  }}
                  className="space-y-4 max-w-md"
                >
                  {/* Fee Type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">Fee Type *</label>
                    <div className="flex gap-2">
                      {(['MONTHLY', 'ONE_TIME'] as const).map(t => (
                        <button
                          key={t} type="button"
                          onClick={() => setFeeForm(f => ({ ...f, feeType: t }))}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            feeForm.feeType === t
                              ? 'bg-[#070235] text-white border-[#070235]'
                              : 'bg-white text-[#505f76] border-[#c8c5d0] hover:bg-[#f2f3ff]'
                          }`}
                        >
                          {t === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">Amount (PKR) *</label>
                    <input
                      required type="number" min="0.01" step="0.01"
                      value={feeForm.amount}
                      onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 5000"
                      className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                      Description <span className="font-normal text-[#787680]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={feeForm.description}
                      onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="e.g. Monthly tuition fee"
                      className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    />
                  </div>

                  {/* Due Day (only for MONTHLY) */}
                  {feeForm.feeType === 'MONTHLY' && (
                    <div>
                      <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                        Due Day <span className="font-normal text-[#787680]">(1–31, optional)</span>
                      </label>
                      <input
                        type="number" min="1" max="31"
                        value={feeForm.dueDay}
                        onChange={e => setFeeForm(f => ({ ...f, dueDay: e.target.value }))}
                        placeholder="e.g. 5"
                        className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                      />
                    </div>
                  )}

                  {feeError && (
                    <p className="flex items-center gap-1 text-xs text-[#ba1a1a]">
                      <span className="material-symbols-outlined text-[14px]">error</span>{feeError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setFeeFormOpen(false); setFeeError(''); }}
                      className="px-5 py-2.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-sm font-semibold hover:bg-[#f2f3ff] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveFeeStructureMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60"
                    >
                      {saveFeeStructureMutation.isPending && (
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      )}
                      {saveFeeStructureMutation.isPending ? 'Saving…' : 'Save Fee Structure'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Fee structure details + generate */
                <div className="space-y-6">
                  {/* Fee details card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#f9f8ff] rounded-xl p-4 border border-[#e4e2e6]">
                      <p className="text-[10px] text-[#787680] uppercase tracking-wide font-semibold mb-1">Type</p>
                      <p className="text-sm font-semibold text-[#131b2e]">
                        {feeStructure!.feeType === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                      </p>
                    </div>
                    <div className="bg-[#f9f8ff] rounded-xl p-4 border border-[#e4e2e6]">
                      <p className="text-[10px] text-[#787680] uppercase tracking-wide font-semibold mb-1">Amount</p>
                      <p className="text-sm font-semibold text-[#131b2e]">
                        PKR {Number(feeStructure!.amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    {feeStructure!.feeType === 'MONTHLY' && (
                      <div className="bg-[#f9f8ff] rounded-xl p-4 border border-[#e4e2e6]">
                        <p className="text-[10px] text-[#787680] uppercase tracking-wide font-semibold mb-1">Due Day</p>
                        <p className="text-sm font-semibold text-[#131b2e]">
                          {feeStructure!.dueDay != null ? `Day ${feeStructure!.dueDay}` : '—'}
                        </p>
                      </div>
                    )}
                    {feeStructure!.description && (
                      <div className="bg-[#f9f8ff] rounded-xl p-4 border border-[#e4e2e6] col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-[#787680] uppercase tracking-wide font-semibold mb-1">Description</p>
                        <p className="text-sm font-semibold text-[#131b2e]">{feeStructure!.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Generate payments section */}
                  <div className="border border-[#e4e2e6] rounded-xl p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#131b2e] mb-1">Generate Payment Records</p>
                        <p className="text-xs text-[#505f76]">
                          {feeStructure!.feeType === 'MONTHLY'
                            ? 'Creates a PENDING payment for each enrolled student for the current month (skips students who already have a payment this month).'
                            : 'Creates a one-time PENDING payment for each enrolled student who does not yet have a payment for this batch.'}
                        </p>
                      </div>
                      <button
                        onClick={() => { setGenerateMsg(''); generatePaymentsMutation.mutate(); }}
                        disabled={generatePaymentsMutation.isPending}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60"
                      >
                        {generatePaymentsMutation.isPending
                          ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                          : <span className="material-symbols-outlined text-[16px]">receipt_long</span>}
                        {generatePaymentsMutation.isPending ? 'Generating…' : 'Generate Payments'}
                      </button>
                    </div>
                    {generateMsg && (
                      <div className={`mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                        generateMsg.includes('0 payment') || generatePaymentsMutation.isError
                          ? 'bg-[#fff8f0] text-[#7a4100]'
                          : 'bg-[#edfcf2] text-[#166534]'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {generateMsg.includes('0 payment') || generatePaymentsMutation.isError ? 'info' : 'check_circle'}
                        </span>
                        {generateMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session modal */}
        {sessionModal && (
          <SessionModal
            initial={sessionModal}
            onClose={() => setSessionModal(null)}
            onSave={handleSessionSave}
            saving={createSessionMutation.isPending || updateSessionMutation.isPending}
          />
        )}

        {/* Bulk Enroll modal */}
        {bulkEnrollOpen && (
          <BulkEnrollModal
            batchId={batchId}
            allStudents={allStudents}
            enrolledIds={enrolledIds}
            onClose={() => setBulkEnrollOpen(false)}
            onSuccess={() => {
              invalidate();
              setBulkEnrollOpen(false);
            }}
          />
        )}

        {/* Confirm delete modal */}
        {confirmModal && (
          <ConfirmModal
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
            loading={removeMutation.isPending || deleteSessionMutation.isPending}
          />
        )}

        {/* Edit batch modal */}
        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2e6]">
                <h2 className="font-semibold text-[#131b2e]">Edit Batch</h2>
                <button onClick={() => setEditModal(false)} className="text-[#787680] hover:text-[#131b2e]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form
                onSubmit={e => { e.preventDefault(); updateBatchMutation.mutate(editForm); }}
                className="p-6 space-y-4"
              >
                {/* Batch name */}
                <div>
                  <label className="block text-sm font-semibold text-[#070235] mb-1.5">Batch Name *</label>
                  <input
                    required type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Morning Batch — Jan 2025"
                    className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                  />
                </div>

                {/* Teacher */}
                <div>
                  <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                    Teacher <span className="font-normal text-[#787680]">(optional)</span>
                  </label>
                  <select
                    value={editForm.teacherId}
                    onChange={e => setEditForm(f => ({ ...f, teacherId: e.target.value }))}
                    className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                  >
                    <option value="">— Unassigned —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">Start Date *</label>
                    <input
                      required type="date"
                      value={editForm.startDate}
                      onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                      className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                      End Date <span className="font-normal text-[#787680]">(opt.)</span>
                    </label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                      className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    />
                  </div>
                </div>

                {/* Timings + Max students */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                      Timings <span className="font-normal text-[#787680]">(opt.)</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.timings}
                      onChange={e => setEditForm(f => ({ ...f, timings: e.target.value }))}
                      placeholder="e.g. Mon/Wed 4–6 PM"
                      className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#070235] mb-1.5">Max Students</label>
                    <input
                      required type="number" min={1}
                      value={editForm.maxStudents}
                      onChange={e => setEditForm(f => ({ ...f, maxStudents: e.target.value }))}
                      className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-[#070235] mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {(['UPCOMING', 'ACTIVE', 'COMPLETED'] as const).map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => setEditForm(f => ({ ...f, status: s }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          editForm.status === s
                            ? 'bg-[#070235] text-white border-[#070235]'
                            : 'bg-white text-[#505f76] border-[#c8c5d0] hover:bg-[#f2f3ff]'
                        }`}
                      >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {editError && (
                  <p className="flex items-center gap-1 text-xs text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[14px]">error</span>{editError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditModal(false)}
                    className="px-5 py-2.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-sm font-semibold hover:bg-[#f2f3ff] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateBatchMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60">
                    {updateBatchMutation.isPending && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    )}
                    {updateBatchMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
