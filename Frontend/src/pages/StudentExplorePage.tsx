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

const COURSE_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5, #6366f1)',
  'linear-gradient(135deg, #0891b2, #06b6d4)',
  'linear-gradient(135deg, #7c3aed, #8b5cf6)',
  'linear-gradient(135deg, #059669, #10b981)',
  'linear-gradient(135deg, #b45309, #d97706)',
  'linear-gradient(135deg, #db2777, #ec4899)',
];

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EnrollAction({
  batch, onRequest, requestingId,
}: {
  batch: BatchBrowse;
  onRequest: (id: number) => void;
  requestingId: number | null;
}) {
  const isFull       = batch.studentCount >= batch.maxStudents;
  const isRequesting = requestingId === batch.id;

  if (batch.enrolled) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        Enrolled
      </div>
    );
  }
  if (batch.requestStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#92400e]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
        Pending
      </span>
    );
  }
  if (batch.requestStatus === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#991b1b]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0" />
        Rejected
      </span>
    );
  }
  if (isFull) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#f1f5f9] text-[#94a3b8]">
        Batch Full
      </span>
    );
  }
  return (
    <button
      disabled={isRequesting}
      onClick={() => onRequest(batch.id)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2f5a 100%)', color: '#fff' }}
    >
      {isRequesting
        ? <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
        : <span className="material-symbols-outlined text-[12px]">send</span>}
      {isRequesting ? 'Sending…' : 'Request'}
    </button>
  );
}

function CourseCard({
  course, batches, gradient, onRequest, requestingId,
}: {
  course: Course;
  batches: BatchBrowse[];
  gradient: string;
  onRequest: (id: number) => void;
  requestingId: number | null;
}) {
  const activeBatches   = batches.filter(b => b.status === 'ACTIVE').length;
  const upcomingBatches = batches.filter(b => b.status === 'UPCOMING').length;

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
            <span className="text-white text-[11px] font-black tracking-wide">
              {course.title.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-bold text-[#0f172a] leading-snug">{course.title}</h3>
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b]">
                {batches.length} batch{batches.length !== 1 ? 'es' : ''}
              </span>
            </div>
            {course.description && (
              <p className="text-[12px] text-[#64748b] mt-1 line-clamp-2 leading-relaxed">{course.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {course.duration && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8]">
                  <span className="material-symbols-outlined text-[12px]">timer</span>
                  {course.duration}
                </span>
              )}
              {activeBatches > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  {activeBatches} active
                </span>
              )}
              {upcomingBatches > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#2563eb]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
                  {upcomingBatches} upcoming
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#f1f5f9]" />

      {/* Batch list */}
      <div className="flex-1">
        {batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[20px] mb-1">event_upcoming</span>
            <p className="text-[12px]">No batches scheduled yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f8fafc]">
            {batches.map(batch => {
              const fillPct = batch.maxStudents > 0
                ? Math.min(100, Math.round((batch.studentCount / batch.maxStudents) * 100)) : 0;
              const isActive = batch.status === 'ACTIVE';
              const start    = fmtDate(batch.startDate);

              return (
                <div key={batch.id} className="px-5 py-3.5 hover:bg-[#fafbff] transition-colors">
                  <div className="flex items-center gap-3">

                    {/* Status dot */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: isActive ? '#22c55e' : '#60a5fa' }}
                    />

                    {/* Batch info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#0f172a] truncate">{batch.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {batch.teacherName && (
                          <span className="text-[11px] text-[#64748b] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">person</span>
                            {batch.teacherName}
                          </span>
                        )}
                        {batch.timings && (
                          <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">schedule</span>
                            {batch.timings}
                          </span>
                        )}
                        {start && (
                          <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                            {start}
                          </span>
                        )}
                      </div>

                      {/* Capacity bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 max-w-[80px] h-1 bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${fillPct}%`,
                              backgroundColor: fillPct >= 90 ? '#f59e0b' : '#6366f1',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[#94a3b8]">
                          {batch.studentCount}/{batch.maxStudents} seats
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      <EnrollAction batch={batch} onRequest={onRequest} requestingId={requestingId} />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentExplorePage() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const queryClient                     = useQueryClient();

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['public-courses'],
    queryFn: async () => { const { data } = await api.get('/public/courses'); return data; },
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery<BatchBrowse[]>({
    queryKey: ['student-browse'],
    queryFn: async () => { const { data } = await api.get('/student/batches/browse'); return data; },
  });

  const isLoading = coursesLoading || batchesLoading;

  const request = useMutation({
    mutationFn: (batchId: number) => api.post(`/student/batches/${batchId}/request`),
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
    return courses.filter(c => {
      const matchesSearch = !q
        || c.title.toLowerCase().includes(q)
        || (c.description ?? '').toLowerCase().includes(q)
        || (batchMap.get(c.id) ?? []).some(b =>
            b.name.toLowerCase().includes(q) ||
            (b.teacherName ?? '').toLowerCase().includes(q),
          );
      return matchesSearch;
    });
  }, [courses, search, batchMap]);

  const filteredBatchMap = useMemo(() => {
    const map = new Map<number, BatchBrowse[]>();
    for (const [courseId, blist] of batchMap.entries()) {
      const filtered = statusFilter === 'ALL' ? blist : blist.filter(b => b.status === statusFilter);
      map.set(courseId, filtered);
    }
    return map;
  }, [batchMap, statusFilter]);

  const enrolledCount = batches.filter(b => b.enrolled).length;
  const pendingCount  = batches.filter(b => b.requestStatus === 'PENDING').length;
  const openBatches   = batches.filter(b => b.status === 'ACTIVE' || b.status === 'UPCOMING').length;

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'ALL',      label: 'All Batches' },
    { key: 'ACTIVE',   label: 'Active' },
    { key: 'UPCOMING', label: 'Upcoming' },
  ];

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">Browse Courses</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-[13px] text-[#64748b]">Explore courses and request a seat in a batch</p>
            <div className="flex items-center gap-2">
              {!isLoading && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef2ff] text-[#4f46e5]">
                    <span className="material-symbols-outlined text-[12px]">menu_book</span>
                    {courses.length} course{courses.length !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    {openBatches} open batch{openBatches !== 1 ? 'es' : ''}
                  </span>
                  {enrolledCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#15803d]">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {enrolledCount} enrolled
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fffbeb] text-[#92400e]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                      {pendingCount} pending
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[15px] text-[#94a3b8]">search</span>
            <input
              type="text"
              placeholder="Search courses, teachers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-[12px] rounded-xl border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 bg-[#f1f5f9] p-1 rounded-xl">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  statusFilter === tab.key
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#374151]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[#94a3b8] ml-auto">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Course cards grid ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[28px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading courses…</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>search_off</span>
            </div>
            <p className="text-[14px] font-semibold text-[#475569]">
              {search ? 'No courses match your search' : 'No courses available right now'}
            </p>
            <p className="text-[12px] text-[#94a3b8] mt-1">Try a different search or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredCourses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                batches={filteredBatchMap.get(course.id) ?? []}
                gradient={COURSE_GRADIENTS[idx % COURSE_GRADIENTS.length]}
                onRequest={(id) => request.mutate(id)}
                requestingId={requestingId}
              />
            ))}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
