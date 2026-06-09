import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface Course {
  id: number;
  title: string;
  description: string | null;
  duration: string | null;
  status: string;
}

interface BatchBrowse {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  teacherName: string | null;
  startDate: string | null;
  endDate: string | null;
  timings: string | null;
  maxStudents: number;
  studentCount: number;
  status: string;
  enrolled: boolean;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'UPCOMING';

const AVATAR_STYLES = [
  { bg: '#eef2ff', text: '#4f46e5' },
  { bg: '#ecfeff', text: '#0891b2' },
  { bg: '#f0fdf4', text: '#16a34a' },
  { bg: '#fefce8', text: '#ca8a04' },
  { bg: '#fdf2f8', text: '#db2777' },
  { bg: '#f5f3ff', text: '#7c3aed' },
];

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EnrollAction({ batch, onRequest, requestingId }: {
  batch: BatchBrowse;
  onRequest: (id: number) => void;
  requestingId: number | null;
}) {
  const isFull       = batch.maxStudents > 0 && batch.studentCount >= batch.maxStudents;
  const isRequesting = requestingId === batch.id;

  if (batch.enrolled) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      Enrolled
    </span>
  );
  if (batch.requestStatus === 'PENDING') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#92400e]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />Pending
    </span>
  );
  if (batch.requestStatus === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#991b1b]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />Rejected
    </span>
  );
  if (isFull) return (
    <span className="text-[11px] text-[#cbd5e1] font-medium">Full</span>
  );
  return (
    <button
      disabled={isRequesting}
      onClick={() => onRequest(batch.id)}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2f5a)' }}
    >
      {isRequesting
        ? <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
        : <span className="material-symbols-outlined text-[12px]">send</span>}
      {isRequesting ? 'Sending…' : 'Request'}
    </button>
  );
}

export default function StudentExplorePage() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expanded, setExpanded]         = useState<Set<number>>(new Set());
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const queryClient                     = useQueryClient();

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['public-courses'],
    queryFn: async () => (await api.get('/public/courses')).data,
  });
  const { data: batches = [], isLoading: batchesLoading } = useQuery<BatchBrowse[]>({
    queryKey: ['student-browse'],
    queryFn: async () => (await api.get('/student/batches/browse')).data,
  });

  const isLoading = coursesLoading || batchesLoading;

  const request = useMutation({
    mutationFn: (id: number) => api.post(`/student/batches/${id}/request`),
    onMutate:   (id) => setRequestingId(id),
    onSettled:  ()   => setRequestingId(null),
    onSuccess:  ()   => queryClient.invalidateQueries({ queryKey: ['student-browse'] }),
  });

  const batchMap = useMemo(() => {
    const map = new Map<number, BatchBrowse[]>();
    for (const b of batches) {
      if (!map.has(b.courseId)) map.set(b.courseId, []);
      map.get(b.courseId)!.push(b);
    }
    return map;
  }, [batches]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter(c =>
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      (batchMap.get(c.id) ?? []).some(b =>
        b.name.toLowerCase().includes(q) || (b.teacherName ?? '').toLowerCase().includes(q),
      ),
    );
  }, [courses, search, batchMap]);

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: 'ALL',      label: 'All' },
    { key: 'ACTIVE',   label: 'Active' },
    { key: 'UPCOMING', label: 'Upcoming' },
  ];

  const enrolledCount = batches.filter(b => b.enrolled).length;
  const pendingCount  = batches.filter(b => b.requestStatus === 'PENDING').length;

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Browse Courses</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Explore courses and request enrollment in a batch</p>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative sm:w-60">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[14px] text-[#9ca3af]">search</span>
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[12px] rounded-xl border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all"
            />
          </div>

          <div className="flex border border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-4 py-2 text-[12px] font-medium border-r last:border-r-0 border-[#e2e8f0] transition-colors ${
                  statusFilter === t.key
                    ? 'bg-[#0d1b3e] text-white'
                    : 'text-[#6b7280] hover:bg-[#f8fafc]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!isLoading && (
            <div className="flex items-center gap-2 sm:ml-auto">
              {enrolledCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#15803d] text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {enrolledCount} enrolled
                </span>
              )}
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fffbeb] text-[#92400e] text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />{pendingCount} pending
                </span>
              )}
              <span className="text-[12px] text-[#9ca3af]">{filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* ── Course list ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[30px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading courses…</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#94a3b8]">
            <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>search_off</span>
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">{search ? 'No courses match your search' : 'No courses available'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCourses.map((course, idx) => {
              const av        = AVATAR_STYLES[idx % AVATAR_STYLES.length];
              const allBatch  = batchMap.get(course.id) ?? [];
              const shown     = statusFilter === 'ALL' ? allBatch : allBatch.filter(b => b.status === statusFilter);
              const activeN   = allBatch.filter(b => b.status === 'ACTIVE').length;
              const upcomingN = allBatch.filter(b => b.status === 'UPCOMING').length;
              const isOpen    = expanded.has(course.id);
              const initials  = course.title.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div key={course.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden transition-shadow hover:shadow-sm">

                  {/* ── Collapsed row ── */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-black"
                      style={{ backgroundColor: av.bg, color: av.text }}>
                      {initials}
                    </div>

                    {/* Title + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#0f172a] leading-snug">{course.title}</p>
                      {course.description && (
                        <p className="text-[12px] text-[#64748b] mt-0.5 truncate">{course.description}</p>
                      )}
                    </div>

                    {/* Batch count pills */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      {activeN > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />{activeN} active
                        </span>
                      )}
                      {upcomingN > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eff6ff] text-[#1d4ed8]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />{upcomingN} upcoming
                        </span>
                      )}
                      {allBatch.length === 0 && (
                        <span className="text-[11px] text-[#cbd5e1]">No batches</span>
                      )}
                    </div>

                    {/* Expand button */}
                    {shown.length > 0 && (
                      <button
                        onClick={() => toggleExpand(course.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                          isOpen
                            ? 'bg-[#f1f5f9] border-[#e2e8f0] text-[#374151]'
                            : 'bg-white border-[#e2e8f0] text-[#374151] hover:bg-[#f8fafc]'
                        }`}
                      >
                        View Batches
                        <span className="material-symbols-outlined text-[14px] transition-transform"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </button>
                    )}
                  </div>

                  {/* ── Expanded batch list ── */}
                  {isOpen && shown.length > 0 && (
                    <div className="border-t border-[#f1f5f9]">
                      <div className="divide-y divide-[#f8fafc]">
                        {shown.map(batch => {
                          const fillPct  = batch.maxStudents > 0
                            ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100)) : 0;
                          const isActive = batch.status === 'ACTIVE';
                          const start    = fmtDate(batch.startDate);

                          return (
                            <div key={batch.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafbff] transition-colors">
                              {/* Status + name */}
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: isActive ? '#22c55e' : '#60a5fa' }} />
                                <div className="min-w-0">
                                  <p className="text-[12px] font-semibold text-[#111827] truncate">{batch.name}</p>
                                  <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                                    {batch.teacherName && (
                                      <span className="text-[11px] text-[#6b7280] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[11px]">person</span>
                                        {batch.teacherName}
                                      </span>
                                    )}
                                    {batch.timings && (
                                      <span className="text-[11px] text-[#9ca3af] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[11px]">schedule</span>
                                        {batch.timings}
                                      </span>
                                    )}
                                    {start && (
                                      <span className="text-[11px] text-[#9ca3af] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                                        {start}
                                      </span>
                                    )}
                                    {batch.maxStudents > 0 && (
                                      <span className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                                        <div className="w-14 h-1 bg-[#f1f5f9] rounded-full overflow-hidden">
                                          <div className="h-full rounded-full"
                                            style={{ width: `${fillPct}%`, backgroundColor: fillPct >= 90 ? '#f59e0b' : av.text }} />
                                        </div>
                                        {batch.studentCount}/{batch.maxStudents}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action */}
                              <div className="shrink-0">
                                <EnrollAction batch={batch} onRequest={id => request.mutate(id)} requestingId={requestingId} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
