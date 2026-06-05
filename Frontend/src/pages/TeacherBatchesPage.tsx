import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

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
  { key: 'ALL', label: 'All' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
];

const STATUS_META: Record<string, { bg: string; text: string }> = {
  UPCOMING:  { bg: '#eff6ff', text: '#1d4ed8' },
  ACTIVE:    { bg: '#f0fdf4', text: '#15803d' },
  COMPLETED: { bg: '#f9fafb', text: '#6b7280' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TeacherBatchesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<StatusFilter>('ALL');

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: async () => { const { data } = await api.get('/teacher/batches'); return data; },
  });

  const filtered = tab === 'ALL' ? batches : batches.filter(b => b.status === tab);

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1e1b4b]">My Batches</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Your assigned teaching batches</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-[#f3f4f6] p-1 rounded-lg mb-6 w-fit">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white text-[#1e1b4b] shadow-sm'
                  : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {t.label}
              {t.key !== 'ALL' && (
                <span className="ml-1.5 text-xs text-[#9ca3af]">
                  ({batches.filter(b => b.status === t.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-[#6b7280]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
            Loading batches…
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
            <span className="material-symbols-outlined text-[48px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <p className="text-sm font-medium">No {tab !== 'ALL' ? tab.toLowerCase() + ' ' : ''}batches assigned</p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(batch => {
              const meta = STATUS_META[batch.status] ?? STATUS_META.COMPLETED;
              const pct = batch.maxStudents > 0 ? Math.round((batch.studentCount / batch.maxStudents) * 100) : 0;
              return (
                <button
                  key={batch.id}
                  onClick={() => navigate(`/teacher/batches/${batch.id}`)}
                  className="bg-white rounded-xl border border-[#e4e2e6] p-5 text-left hover:border-[#6366f1] hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#1e1b4b] text-sm leading-snug group-hover:text-[#6366f1] transition-colors pr-2">
                      {batch.name}
                    </h3>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                      style={{ backgroundColor: meta.bg, color: meta.text }}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#6b7280] mb-4">{batch.courseName}</p>

                  {/* Student fill bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
                      <span>{batch.studentCount} students</span>
                      <span>{pct}% full</span>
                    </div>
                    <div className="h-1.5 bg-[#f3f4f6] rounded-full">
                      <div
                        className="h-full rounded-full bg-[#6366f1]"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-[#9ca3af]">
                    {batch.timings && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {batch.timings}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                      {fmtDate(batch.startDate)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
