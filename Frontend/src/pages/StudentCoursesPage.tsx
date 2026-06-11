import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { STUDENT_NAV } from '../lib/studentNav';
import { apiGet } from '../lib/api';
import { BATCH_BROWSE_STATUS_META } from '../lib/statusMeta';

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

const FILE_META: Record<string, { icon: string; color: string; bg: string }> = {
  PDF:   { icon: 'picture_as_pdf', color: '#dc2626', bg: '#fef2f2' },
  VIDEO: { icon: 'smart_display',  color: '#7c3aed', bg: '#f5f3ff' },
  IMAGE: { icon: 'image',          color: '#0891b2', bg: '#ecfeff' },
  DOC:   { icon: 'description',    color: '#2563eb', bg: '#eff6ff' },
  OTHER: { icon: 'attach_file',    color: '#4b5563', bg: '#f3f4f6' },
};

const COURSE_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
  'linear-gradient(135deg,#059669,#10b981)',
  'linear-gradient(135deg,#d97706,#f59e0b)',
  'linear-gradient(135deg,#dc2626,#ef4444)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
];

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MaterialsList({ courseId }: { courseId: number }) {
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['student-materials', courseId],
    queryFn: apiGet(`/student/courses/${courseId}/materials`),
  });
  return (
    <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <span className="material-symbols-outlined text-[14px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
        <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">Course Materials</span>
        {!isLoading && (
          <span className="text-[10px] text-[#94a3b8] font-normal ml-1">
            ({materials.length} file{materials.length !== 1 ? 's' : ''})
          </span>
        )}
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
                <span className="material-symbols-outlined text-[14px] text-[#cbd5e1] group-hover:text-[#6366f1] transition-colors shrink-0">open_in_new</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MaterialsDrawer({ courseId, colSpan }: { courseId: number; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 pb-4 pt-0 bg-white">
        <MaterialsList courseId={courseId} />
      </td>
    </tr>
  );
}

const PAGE_SIZE = 8;

export default function StudentCoursesPage() {
  const [filter, setFilter]         = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage]             = useState(1);

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['student-batches'],
    queryFn: apiGet('/student/batches'),
  });

  const counts = useMemo(() => ({
    ALL:       batches.length,
    ACTIVE:    batches.filter(b => b.status === 'ACTIVE').length,
    UPCOMING:  batches.filter(b => b.status === 'UPCOMING').length,
    COMPLETED: batches.filter(b => b.status === 'COMPLETED').length,
  }), [batches]);

  const filtered = useMemo(() =>
    filter === 'ALL' ? batches : batches.filter(b => b.status === filter),
    [batches, filter],
  );

  useEffect(() => { setPage(1); }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs = [
    { key: 'ALL',       label: 'All Courses' },
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
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">My Courses</h1>
            <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Your enrolled batches and course materials</p>
          </div>
          {!isLoading && batches.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eef2ff] text-[#4f46e5] text-[12px] font-semibold">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                {counts.ALL} enrolled
              </span>
              {counts.ACTIVE > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fdf4] text-[#15803d] text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  {counts.ACTIVE} active
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">

          {/* Tabs — pill style, scrollable on mobile */}
          <div className="overflow-x-auto border-b border-[#e2e8f0] px-3 sm:px-5 py-3">
            <div className="flex gap-1.5 min-w-max">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                    filter === t.key
                      ? 'bg-[#0d1b3e] text-white shadow-sm'
                      : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] hover:text-[#374151]'
                  }`}
                >
                  {t.label}
                  {counts[t.key] > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      filter === t.key ? 'bg-white/20 text-white' : 'bg-white text-[#64748b]'
                    }`}>
                      {counts[t.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <LogoSpinner message="Loading your courses…" py="py-20" />
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
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#f1f5f9]">
                {paginated.map(batch => {
                  const meta = BATCH_BROWSE_STATUS_META[batch.status] ?? BATCH_BROWSE_STATUS_META.COMPLETED;
                  const isExpanded = expandedId === batch.courseId;
                  const gradient = COURSE_GRADIENTS[batch.courseId % COURSE_GRADIENTS.length];
                  const initials = batch.courseName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={batch.id}>
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: gradient }}>
                          <span className="text-white text-[12px] font-black">{initials}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold text-[#0f172a] leading-snug truncate">{batch.courseName}</p>
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: meta.bg, color: meta.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748b] mt-0.5 truncate">{batch.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                            {batch.teacherName && (
                              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                                <span className="material-symbols-outlined text-[11px]">person</span>
                                {batch.teacherName}
                              </span>
                            )}
                            {batch.timings && (
                              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                                <span className="material-symbols-outlined text-[11px]">schedule</span>
                                {batch.timings}
                              </span>
                            )}
                            {batch.startDate && (
                              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                                <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                                {fmtDate(batch.startDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Files toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : batch.courseId)}
                          className={`shrink-0 flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
                            isExpanded ? 'bg-[#eef2ff] text-[#4f46e5]' : 'text-[#94a3b8] hover:bg-[#f1f5f9]'
                          }`}>
                          <span className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: isExpanded ? "'FILL' 1" : "'FILL' 0" }}>folder</span>
                          <span className="text-[9px] font-semibold">Files</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-3">
                          <MaterialsList courseId={batch.courseId} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8f9fa]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Course</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Teacher</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Schedule</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Dates</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Capacity</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Materials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {paginated.map((batch) => {
                    const meta       = BATCH_BROWSE_STATUS_META[batch.status] ?? BATCH_BROWSE_STATUS_META.COMPLETED;
                    const isExpanded = expandedId === batch.courseId;
                    const fillPct    = batch.maxStudents > 0
                      ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100)) : 0;
                    const gradient   = COURSE_GRADIENTS[batch.courseId % COURSE_GRADIENTS.length];
                    const initials   = batch.courseName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={batch.id} className="hover:bg-[#fafbff] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
                              <span className="text-white text-[11px] font-black">{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#0f172a] leading-tight truncate">{batch.courseName}</p>
                              <p className="text-[11px] text-[#94a3b8] mt-0.5 truncate">{batch.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
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
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {batch.timings
                            ? <span className="text-[12px] text-[#475569]">{batch.timings}</span>
                            : <span className="text-[12px] text-[#cbd5e1]">—</span>}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <p className="text-[12px] text-[#475569]">{fmtDate(batch.startDate)}</p>
                          {batch.endDate && <p className="text-[11px] text-[#94a3b8] mt-0.5">→ {fmtDate(batch.endDate)}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ backgroundColor: meta.bg, color: meta.color }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {batch.maxStudents > 0 ? (
                            <div className="w-24">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[#94a3b8]">{batch.studentCount}/{batch.maxStudents}</span>
                                <span className="text-[10px] font-semibold" style={{ color: fillPct >= 90 ? '#d97706' : '#6366f1' }}>{fillPct}%</span>
                              </div>
                              <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${fillPct}%`, backgroundColor: fillPct >= 90 ? '#f59e0b' : '#6366f1' }} />
                              </div>
                            </div>
                          ) : <span className="text-[12px] text-[#cbd5e1]">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : batch.courseId)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              isExpanded ? 'bg-[#eef2ff] text-[#4f46e5]' : 'text-[#64748b] hover:bg-[#eef2ff] hover:text-[#4f46e5]'
                            }`}>
                            <span className="material-symbols-outlined text-[14px]"
                              style={{ fontVariationSettings: isExpanded ? "'FILL' 1" : "'FILL' 0" }}>folder</span>
                            Files
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.map(batch =>
                    expandedId === batch.courseId
                      ? <MaterialsDrawer key={`mat-${batch.courseId}`} courseId={batch.courseId} colSpan={7} />
                      : null
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* Pagination */}
          {!isLoading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f5f9]">
              <p className="text-[12px] text-[#94a3b8]">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition-all ${
                      page === p ? 'bg-[#0d1b3e] text-white shadow-sm' : 'text-[#64748b] hover:bg-[#f1f5f9]'
                    }`}>
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
