import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface AttendanceSummary {
  batchId: number;
  batchName: string;
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

interface AttendanceRecord {
  id: number;
  sessionId: number;
  sessionTitle: string;
  sessionDate: string;
  batchId: number;
  batchName: string;
  status: string;
  notes: string | null;
  markedAt: string | null;
}

const STATUS_META = {
  PRESENT: { label: 'Present', color: '#16a34a', dot: '#22c55e', bg: '#f0fdf4' },
  LATE:    { label: 'Late',    color: '#d97706', dot: '#f59e0b', bg: '#fffbeb' },
  ABSENT:  { label: 'Absent',  color: '#dc2626', dot: '#ef4444', bg: '#fef2f2' },
} as const;

const BATCH_GRADIENTS = [
  'linear-gradient(135deg,#4f46e5,#6366f1)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
  'linear-gradient(135deg,#7c3aed,#8b5cf6)',
  'linear-gradient(135deg,#059669,#10b981)',
  'linear-gradient(135deg,#b45309,#d97706)',
  'linear-gradient(135deg,#db2777,#ec4899)',
];

function pctColor(p: number) {
  if (p >= 75) return { text: '#15803d', bg: '#f0fdf4', bar: '#22c55e' };
  if (p >= 50) return { text: '#92400e', bg: '#fffbeb', bar: '#f59e0b' };
  return              { text: '#991b1b', bg: '#fef2f2', bar: '#ef4444' };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StudentAttendancePage() {
  const { data: summaries = [], isLoading: sl } = useQuery<AttendanceSummary[]>({
    queryKey: ['student-attendance-summary'],
    queryFn: async () => { const { data } = await api.get('/student/attendance/summary'); return data; },
  });

  const { data: records = [], isLoading: rl } = useQuery<AttendanceRecord[]>({
    queryKey: ['student-attendance'],
    queryFn: async () => { const { data } = await api.get('/student/attendance'); return data; },
  });

  const isLoading = sl || rl;

  const recordsByBatch = useMemo(() =>
    records.reduce((acc, r) => {
      (acc[r.batchId] ??= []).push(r);
      return acc;
    }, {} as Record<number, AttendanceRecord[]>),
    [records],
  );

  const overallPct = useMemo(() => {
    if (!summaries.length) return 0;
    const total   = summaries.reduce((a, s) => a + s.totalSessions, 0);
    const present = summaries.reduce((a, s) => a + s.present + s.late, 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [summaries]);

  const totalSessions = summaries.reduce((a, s) => a + s.totalSessions, 0);
  const totalPresent  = summaries.reduce((a, s) => a + s.present, 0);
  const totalAbsent   = summaries.reduce((a, s) => a + s.absent, 0);
  const opc           = pctColor(overallPct);

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">
            My Attendance
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-[11px] sm:text-[13px] text-[#64748b]">Your attendance record across all enrolled batches</p>
            {!isLoading && summaries.length > 0 && (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef2ff] text-[#4f46e5]">
                  <span className="material-symbols-outlined text-[12px]">event</span>
                  {totalSessions} sessions
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: opc.bg, color: opc.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opc.bar }} />
                  {overallPct}% overall
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16a34a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />{totalPresent} present
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#dc2626]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />{totalAbsent} absent
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[28px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading attendance…</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[30px] text-[#cbd5e1]" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
            </div>
            <p className="text-[15px] font-semibold text-[#374151]">No attendance recorded yet</p>
            <p className="text-[12px] text-[#94a3b8] mt-1">Your teacher will mark attendance after each session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((s, idx) => {
              const col      = pctColor(s.percentage);
              const fillPct  = Math.min(100, s.percentage);
              const gradient = BATCH_GRADIENTS[idx % BATCH_GRADIENTS.length];
              const initials = s.batchName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const batchRecs = (recordsByBatch[s.batchId] ?? [])
                .slice().sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

              return (
                <div key={s.batchId} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">

                  {/* Card header */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
                        <span className="text-white text-[11px] font-black">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[14px] font-bold text-[#0f172a] truncate">{s.batchName}</p>
                          <span
                            className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: col.bg, color: col.text }}
                          >
                            {s.percentage}%
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748b] mt-0.5">{s.totalSessions} sessions total</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${fillPct}%`, backgroundColor: col.bar }}
                      />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-2.5">
                      {([
                        { key: 'PRESENT', val: s.present  },
                        { key: 'LATE',    val: s.late     },
                        { key: 'ABSENT',  val: s.absent   },
                      ] as const).map(({ key, val }) => {
                        const m = STATUS_META[key];
                        return (
                          <span key={key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: m.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.dot }} />
                            {val} {m.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session list */}
                  {batchRecs.length > 0 && (
                    <>
                      <div className="border-t border-[#f1f5f9]" />
                      <div className="divide-y divide-[#f8fafc]">
                        {batchRecs.map(r => {
                          const meta = STATUS_META[r.status as keyof typeof STATUS_META] ?? STATUS_META.ABSENT;
                          return (
                            <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#fafbff] transition-colors">
                              <div className="w-[68px] shrink-0 text-[11px] text-[#94a3b8]">{fmtDate(r.sessionDate)}</div>
                              <p className="flex-1 min-w-0 text-[12px] font-medium text-[#0f172a] truncate">{r.sessionTitle}</p>
                              <span
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{ backgroundColor: meta.bg, color: meta.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                                {meta.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {batchRecs.length === 0 && (
                    <div className="px-5 py-3 border-t border-[#f1f5f9]">
                      <p className="text-[12px] text-[#94a3b8]">No sessions marked yet</p>
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
