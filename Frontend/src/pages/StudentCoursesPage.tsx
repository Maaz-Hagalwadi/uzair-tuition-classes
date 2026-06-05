import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface Batch {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  teacherName: string | null;
  startDate: string | null;
  endDate: string | null;
  timings: string | null;
  status: string;
  studentCount: number;
  maxStudents: number;
}

interface Material {
  id: number;
  courseId: number;
  title: string;
  fileUrl: string;
  fileType: string | null;
  uploadedByName: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    color: '#16a34a', dot: '#22c55e' },
  UPCOMING:  { label: 'Upcoming',  color: '#2563eb', dot: '#60a5fa' },
  COMPLETED: { label: 'Completed', color: '#64748b', dot: '#94a3b8' },
};

const FILE_META: Record<string, { icon: string; color: string; bg: string }> = {
  PDF:   { icon: 'picture_as_pdf', color: '#dc2626', bg: '#fef2f2' },
  VIDEO: { icon: 'smart_display',  color: '#7c3aed', bg: '#f5f3ff' },
  IMAGE: { icon: 'image',          color: '#0891b2', bg: '#ecfeff' },
  DOC:   { icon: 'description',    color: '#2563eb', bg: '#eff6ff' },
  OTHER: { icon: 'attach_file',    color: '#4b5563', bg: '#f3f4f6' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MaterialsDrawer({ courseId }: { courseId: number }) {
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['student-materials', courseId],
    queryFn: async () => { const { data } = await api.get(`/student/courses/${courseId}/materials`); return data; },
  });

  return (
    <tr>
      <td colSpan={7} className="px-6 pb-4 pt-0">
        <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
            <span className="material-symbols-outlined text-[14px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">Course Materials</span>
            {!isLoading && <span className="text-[10px] text-[#94a3b8] font-normal ml-1">({materials.length} file{materials.length !== 1 ? 's' : ''})</span>}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3.5 text-[12px] text-[#94a3b8]">
              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Loading…
            </div>
          ) : materials.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3.5 text-[12px] text-[#94a3b8]">
              <span className="material-symbols-outlined text-[14px]">folder_open</span> No materials uploaded yet
            </div>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {materials.map(m => {
                const key = (m.fileType ?? 'OTHER').toUpperCase() as keyof typeof FILE_META;
                const { icon, color, bg } = FILE_META[key] ?? FILE_META.OTHER;
                return (
                  <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                      <span className="material-symbols-outlined text-[13px]" style={{ color }}>{icon}</span>
                    </div>
                    <span className="flex-1 text-[12px] font-medium text-[#374151] truncate">{m.title}</span>
                    {m.uploadedByName && <span className="text-[11px] text-[#94a3b8] hidden sm:block shrink-0">{m.uploadedByName}</span>}
                    <span className="material-symbols-outlined text-[14px] text-[#cbd5e1] group-hover:text-[#6366f1] transition-colors shrink-0">open_in_new</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

const PAGE_SIZE = 8;

export default function StudentCoursesPage() {
  const [filter, setFilter]         = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage]             = useState(1);

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['student-batches'],
    queryFn: async () => { const { data } = await api.get('/student/batches'); return data; },
  });

  const counts = useMemo(() => ({
    ALL:       batches.length,
    ACTIVE:    batches.filter(b => b.status === 'ACTIVE').length,
    UPCOMING:  batches.filter(b => b.status === 'UPCOMING').length,
    COMPLETED: batches.filter(b => b.status === 'COMPLETED').length,
  }), [batches]);

  const filtered = useMemo(() =>
    filter === 'ALL' ? batches : batches.filter(b => b.status === filter),
    [batches, filter]
  );

  useEffect(() => { setPage(1); }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paginated.length > 0 && paginated.every(b => selected.has(b.id));

  function toggleAll() {
    setSelected(prev => {
      const s = new Set(prev);
      allChecked ? paginated.forEach(b => s.delete(b.id)) : paginated.forEach(b => s.add(b.id));
      return s;
    });
  }
  function toggleOne(id: number) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const tabs = [
    { key: 'ALL',       label: 'All' },
    { key: 'ACTIVE',    label: 'Active' },
    { key: 'UPCOMING',  label: 'Upcoming' },
    { key: 'COMPLETED', label: 'Completed' },
  ] as const;

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">My Courses</h1>
            <p className="text-[13px] text-[#64748b] mt-0.5">Manage your enrolled batches, schedules and course materials</p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { label: 'ENROLLED BATCHES',  value: counts.ALL,                        sub: 'total across all courses',              icon: 'menu_book' },
            { label: 'ACTIVE / UPCOMING', value: counts.ACTIVE + counts.UPCOMING,   sub: `${counts.ACTIVE} active · ${counts.UPCOMING} upcoming`, icon: 'pending_actions' },
            { label: 'COMPLETED',         value: counts.COMPLETED,                  sub: 'courses finished',                      icon: 'task_alt' },
          ] as const).map(card => (
            <div key={card.label} className="relative rounded-2xl overflow-hidden p-5"
              style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2f5a 60%, #1e3a6e 100%)' }}>
              <span className="material-symbols-outlined absolute -right-2 -top-2 text-[72px] opacity-[0.06] text-white select-none pointer-events-none"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {card.icon}
              </span>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">{card.label}</p>
              <p className="text-[38px] font-black text-white leading-none">{isLoading ? '—' : card.value}</p>
              <p className="text-[11px] text-white/50 mt-1.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">

          {/* Controls bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-1.5">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all
                    ${filter === t.key
                      ? 'bg-[#0d1b3e] text-white shadow-sm'
                      : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#374151]'}`}>
                  {t.label}
                  {counts[t.key] > 0 && (
                    <span className={`ml-1 text-[10px] font-bold ${filter === t.key ? 'text-white/60' : 'text-[#94a3b8]'}`}>
                      ({counts[t.key]})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedId(paginated.find(b => selected.has(b.id))?.courseId ?? null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1b3e] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-[13px]">visibility</span>
                  View Materials
                </button>
                <button onClick={() => setSelected(new Set())}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Table body */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
              <span className="material-symbols-outlined text-[28px] animate-spin mb-2">sync</span>
              <p className="text-[13px]">Loading your courses…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
              <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              </div>
              <p className="text-[13px] font-semibold text-[#475569]">
                {filter === 'ALL' ? 'No enrolled courses yet' : `No ${filter.toLowerCase()} courses`}
              </p>
              <p className="text-[12px] text-[#94a3b8] mt-1">Contact admin to get enrolled in a batch</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f1f5f9]">
                  <th className="w-10 px-5 py-3">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded accent-[#6366f1] cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Course</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider hidden md:table-cell">Teacher</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider hidden lg:table-cell">Schedule</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider hidden lg:table-cell">Dates</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Capacity</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {paginated.map(batch => {
                  const meta       = STATUS_META[batch.status] ?? STATUS_META.COMPLETED;
                  const isChecked  = selected.has(batch.id);
                  const isExpanded = expandedId === batch.courseId;
                  const fillPct    = batch.maxStudents > 0
                    ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100)) : 0;
                  return (
                    <tr key={batch.id} className={`transition-colors ${isChecked ? 'bg-[#f5f7ff]' : 'hover:bg-[#fafbff]'}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(batch.id)}
                          className="w-3.5 h-3.5 rounded accent-[#6366f1] cursor-pointer" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                            <span className="text-white text-[11px] font-black">{batch.courseName.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#0f172a] leading-tight">{batch.courseName}</p>
                            <p className="text-[11px] text-[#94a3b8] mt-0.5">{batch.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {batch.teacherName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#eef2ff] flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-[#6366f1]">
                                {batch.teacherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[12px] text-[#475569]">{batch.teacherName}</span>
                          </div>
                        ) : <span className="text-[12px] text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {batch.timings
                          ? <span className="text-[12px] text-[#475569]">{batch.timings}</span>
                          : <span className="text-[12px] text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-[12px] text-[#475569]">{fmtDate(batch.startDate)}</p>
                        {batch.endDate && <p className="text-[11px] text-[#94a3b8] mt-0.5">→ {fmtDate(batch.endDate)}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: meta.color }}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
                          {meta.label}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {batch.maxStudents > 0 ? (
                          <div className="w-24">
                            <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-1">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${fillPct}%`, backgroundColor: fillPct >= 90 ? '#f59e0b' : '#6366f1' }} />
                            </div>
                            <p className="text-[10px] text-[#94a3b8]">{batch.studentCount}/{batch.maxStudents} · {fillPct}%</p>
                          </div>
                        ) : <span className="text-[12px] text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : batch.courseId)}
                          title="Course Materials"
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all
                            ${isExpanded ? 'bg-[#eef2ff] text-[#6366f1]' : 'text-[#94a3b8] hover:bg-[#eef2ff] hover:text-[#6366f1]'}`}>
                          <span className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: isExpanded ? "'FILL' 1" : "'FILL' 0" }}>
                            folder
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Inline materials drawer — separate map so no fragment-in-tbody issues */}
                {paginated.map(batch =>
                  expandedId === batch.courseId
                    ? <MaterialsDrawer key={`mat-${batch.courseId}`} courseId={batch.courseId} />
                    : null
                )}
              </tbody>
            </table>
          )}

          {/* Footer */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f5f9]">
              <p className="text-[12px] text-[#94a3b8]">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                {selected.size > 0 && <span className="ml-2 font-semibold text-[#6366f1]">· {selected.size} selected</span>}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition-all
                      ${page === p ? 'bg-[#0d1b3e] text-white shadow-sm' : 'text-[#64748b] hover:bg-[#f1f5f9]'}`}>
                    {p}
                  </button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
