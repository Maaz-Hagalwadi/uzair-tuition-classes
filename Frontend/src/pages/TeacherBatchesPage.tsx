import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import { apiGet } from '../lib/api';
import { BATCH_STATUS_INLINE_META } from '../lib/statusMeta';

interface Batch {
  id: number;
  name: string;
  courseName: string;
  startDate: string;
  endDate: string | null;
  timings: string | null;
  maxStudents: number;
  status: string;
  studentCount: number;
}

type StatusFilter = 'ALL' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL',       label: 'All' },
  { key: 'UPCOMING',  label: 'Upcoming' },
  { key: 'ACTIVE',    label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
];

const BATCH_GRADIENTS = [
  'from-[#6366f1] to-[#8b5cf6]',
  'from-[#0ea5e9] to-[#6366f1]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#10b981] to-[#0ea5e9]',
  'from-[#ec4899] to-[#f59e0b]',
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TeacherBatchesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<StatusFilter>('ALL');

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: apiGet('/teacher/batches'),
  });

  const filtered = tab === 'ALL' ? batches : batches.filter(b => b.status === tab);

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">My Batches</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Your assigned teaching batches</p>
        </div>

        {/* Pill tabs — scrollable on mobile */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1.5 min-w-max">
            {STATUS_TABS.map(t => {
              const count = t.key === 'ALL' ? batches.length : batches.filter(b => b.status === t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                    tab === t.key
                      ? 'bg-[#0f172a] text-white shadow-sm'
                      : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] hover:text-[#374151]'
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tab === t.key ? 'bg-white/20 text-white' : 'bg-white text-[#64748b]'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
              <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
              <p className="text-[13px]">Loading batches…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
              <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <p className="text-[13px]">No {tab !== 'ALL' ? tab.toLowerCase() + ' ' : ''}batches assigned</p>
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <div className="sm:hidden divide-y divide-[#f1f5f9]">
                {filtered.map((batch, idx) => {
                  const meta = BATCH_STATUS_INLINE_META[batch.status] ?? BATCH_STATUS_INLINE_META.COMPLETED;
                  const pct  = batch.maxStudents > 0 ? Math.round((batch.studentCount / batch.maxStudents) * 100) : 0;
                  const grad = BATCH_GRADIENTS[idx % BATCH_GRADIENTS.length];
                  const initials = batch.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={batch.id} className="flex items-center gap-3 px-4 py-3.5 active:bg-[#f8fafc]"
                      onClick={() => navigate(`/teacher/batches/${batch.id}`)}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-[11px] font-bold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-[#0f172a] truncate">{batch.name}</p>
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: meta.bg, color: meta.text }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                            {batch.status.charAt(0) + batch.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748b] mt-0.5 truncate">{batch.courseName}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-[#94a3b8]">{batch.studentCount}/{batch.maxStudents} students</span>
                              <span className="text-[10px] text-[#94a3b8]">{pct}%</span>
                            </div>
                            <div className="h-1 bg-[#f1f5f9] rounded-full">
                              <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                          {batch.timings && (
                            <span className="flex items-center gap-1 text-[10px] text-[#94a3b8] shrink-0">
                              <span className="material-symbols-outlined text-[11px]">schedule</span>
                              {batch.timings}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-[#cbd5e1] shrink-0">chevron_right</span>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <table className="hidden sm:table w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8f9fa]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Batch</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Timings</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Start Date</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Students</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filtered.map((batch, idx) => {
                    const meta = BATCH_STATUS_INLINE_META[batch.status] ?? BATCH_STATUS_INLINE_META.COMPLETED;
                    const pct  = batch.maxStudents > 0 ? Math.round((batch.studentCount / batch.maxStudents) * 100) : 0;
                    const grad = BATCH_GRADIENTS[idx % BATCH_GRADIENTS.length];
                    const initials = batch.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={batch.id} className="hover:bg-[#fafbff] transition-colors cursor-pointer"
                        onClick={() => navigate(`/teacher/batches/${batch.id}`)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                              <span className="text-white text-[10px] font-bold">{initials}</span>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#0f172a]">{batch.name}</p>
                              <p className="text-[11px] text-[#94a3b8]">{batch.courseName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] text-[#374151]">{batch.timings ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-[12px] text-[#374151]">{fmtDate(batch.startDate)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="min-w-[80px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] text-[#374151] font-medium">{batch.studentCount}/{batch.maxStudents}</span>
                              <span className="text-[10px] text-[#94a3b8]">{pct}%</span>
                            </div>
                            <div className="h-1 bg-[#f1f5f9] rounded-full">
                              <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: meta.bg, color: meta.text }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                            {batch.status.charAt(0) + batch.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="material-symbols-outlined text-[16px] text-[#94a3b8]">chevron_right</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
