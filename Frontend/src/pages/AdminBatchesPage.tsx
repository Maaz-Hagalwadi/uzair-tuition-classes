import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
export { ADMIN_NAV };
import api from '../lib/api';

type StatusFilter = 'ALL' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

interface Batch {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  teacherId: number | null;
  teacherName: string | null;
  startDate: string;
  endDate: string | null;
  timings: string | null;
  maxStudents: number;
  status: string;
  studentCount: number;
}

interface Course { id: number; title: string; }
interface Teacher { id: number; firstName: string; lastName: string; }

interface BatchForm {
  name: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  timings: string;
  maxStudents: string;
  status: string;
}

const EMPTY_FORM: BatchForm = {
  name: '', courseId: '', teacherId: '', startDate: '', endDate: '',
  timings: '', maxStudents: '30', status: 'UPCOMING',
};

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING:  { bg: 'bg-[#d0e1fb]', text: 'text-[#0b1c30]', dot: 'bg-[#1565c0]' },
  ACTIVE:    { bg: 'bg-[#d8f4e4]', text: 'text-[#0a3320]', dot: 'bg-[#1a6b3a]' },
  COMPLETED: { bg: 'bg-[#e4e2e6]', text: 'text-[#47464f]', dot: 'bg-[#787680]' },
};

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.COMPLETED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function BatchModal({
  initial, onClose, onSave, saving, courses, teachers,
}: {
  initial: BatchForm & { id?: number };
  onClose: () => void;
  onSave: (f: BatchForm) => void;
  saving: boolean;
  courses: Course[];
  teachers: Teacher[];
}) {
  const [form, setForm] = useState<BatchForm>({ ...initial });
  const set = (k: keyof BatchForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2e6]">
          <h2 className="font-semibold text-[#131b2e]">{isEdit ? 'Edit Batch' : 'New Batch'}</h2>
          <button onClick={onClose} className="text-[#787680] hover:text-[#131b2e] transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">Batch Name *</label>
            <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Mathematics Batch A"
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">Course *</label>
              <select required value={form.courseId} onChange={e => set('courseId', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all">
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                Teacher <span className="font-normal text-[#787680]">(optional)</span>
              </label>
              <select value={form.teacherId} onChange={e => set('teacherId', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all">
                <option value="">Unassigned</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">Start Date *</label>
              <input required type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                End Date <span className="font-normal text-[#787680]">(optional)</span>
              </label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                Timings <span className="font-normal text-[#787680]">(optional)</span>
              </label>
              <input type="text" value={form.timings} onChange={e => set('timings', e.target.value)}
                placeholder="e.g. Mon/Wed 5–7 PM"
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">Max Students</label>
              <input type="number" min={1} max={200} value={form.maxStudents} onChange={e => set('maxStudents', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all">
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-sm font-semibold hover:bg-[#f2f3ff] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60">
              {saving && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBatchesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<StatusFilter>('ALL');
  const [modal, setModal] = useState<null | (BatchForm & { id?: number })>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: batches = [], isLoading, isError } = useQuery<Batch[]>({
    queryKey: ['admin-batches', tab],
    queryFn: async () => {
      const params = tab !== 'ALL' ? `?status=${tab}` : '';
      const { data } = await api.get(`/admin/batches${params}`);
      return data;
    },
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses-list'],
    queryFn: async () => { const { data } = await api.get('/admin/courses'); return data; },
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['teachers-list'],
    queryFn: async () => { const { data } = await api.get('/admin/users?role=TEACHER'); return data; },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-batches'] });

  const createMutation = useMutation({
    mutationFn: (f: BatchForm) => api.post('/admin/batches', {
      name: f.name, courseId: Number(f.courseId),
      teacherId: f.teacherId ? Number(f.teacherId) : null,
      startDate: f.startDate, endDate: f.endDate || null,
      timings: f.timings || null, maxStudents: Number(f.maxStudents), status: f.status,
    }),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: number; f: BatchForm }) => api.put(`/admin/batches/${id}`, {
      name: f.name, courseId: Number(f.courseId),
      teacherId: f.teacherId ? Number(f.teacherId) : null,
      startDate: f.startDate, endDate: f.endDate || null,
      timings: f.timings || null, maxStudents: Number(f.maxStudents), status: f.status,
    }),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/batches/${id}`),
    onSuccess: () => { invalidate(); setDeleteConfirm(null); },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  function handleSave(f: BatchForm) {
    if (modal?.id) updateMutation.mutate({ id: modal.id, f });
    else createMutation.mutate(f);
  }

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-[28px] leading-[36px] font-semibold text-[#070235]">Batches</h1>
            <p className="text-sm text-[#505f76] mt-1">Manage class batches, assign teachers and enrol students.</p>
          </div>
          <button onClick={() => setModal(EMPTY_FORM)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Batch
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-[#c8c5d0] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t.key ? 'bg-[#070235] text-white shadow-sm' : 'text-[#505f76] hover:bg-[#f2f3ff] hover:text-[#070235]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32 text-[#787680]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
            Loading batches…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-32 text-[#93000a]">
            <span className="material-symbols-outlined text-[24px] mr-2">error</span>
            Failed to load batches.
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span className="material-symbols-outlined text-[56px] text-[#c8c5d0] mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <p className="text-sm text-[#787680] mb-4">No batches yet. Create your first one.</p>
            <button onClick={() => setModal(EMPTY_FORM)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>New Batch
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e4e2e6] bg-[#faf8ff]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Batch</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Course</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Teacher</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Schedule</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Students</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e2e6]">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-[#faf8ff] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#131b2e] cursor-pointer hover:text-[#070235]"
                        onClick={() => navigate(`/admin/batches/${batch.id}`)}>
                        {batch.name}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[#505f76] text-xs">{batch.courseName}</td>
                    <td className="px-5 py-4 text-[#505f76] text-xs">{batch.teacherName ?? <span className="text-[#c8c5d0]">Unassigned</span>}</td>
                    <td className="px-5 py-4 text-xs text-[#505f76]">
                      <p>{batch.startDate}{batch.endDate ? ` → ${batch.endDate}` : ''}</p>
                      {batch.timings && <p className="text-[#787680]">{batch.timings}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-[#131b2e]">{batch.studentCount}</span>
                      <span className="text-xs text-[#787680]">/{batch.maxStudents}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={batch.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/admin/batches/${batch.id}`)}
                          className="p-1.5 text-[#787680] hover:text-[#070235] hover:bg-[#f2f3ff] rounded-lg transition-colors" title="Manage students">
                          <span className="material-symbols-outlined text-[16px]">group</span>
                        </button>
                        <button onClick={() => setModal({
                          id: batch.id, name: batch.name,
                          courseId: String(batch.courseId),
                          teacherId: batch.teacherId ? String(batch.teacherId) : '',
                          startDate: batch.startDate, endDate: batch.endDate ?? '',
                          timings: batch.timings ?? '', maxStudents: String(batch.maxStudents),
                          status: batch.status,
                        })}
                          className="p-1.5 text-[#787680] hover:text-[#070235] hover:bg-[#f2f3ff] rounded-lg transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        {deleteConfirm === batch.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteMutation.mutate(batch.id)} disabled={deleteMutation.isPending}
                              className="px-2 py-1 text-xs bg-[#ba1a1a] text-white rounded-lg font-semibold">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs border border-[#c8c5d0] text-[#505f76] rounded-lg">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(batch.id)}
                            className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <BatchModal initial={modal} onClose={() => setModal(null)} onSave={handleSave}
          saving={saving} courses={courses} teachers={teachers} />
      )}
    </DashboardShell>
  );
}
