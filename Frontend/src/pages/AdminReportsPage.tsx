import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { ADMIN_NAV } from '../lib/adminNav';
import { apiGet } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthlyStats {
  month: string;
  revenue: number;
  enrollments: number;
}

interface BatchOccupancy {
  batchId: number;
  batchName: string;
  enrolled: number;
  maxStudents: number;
  pct: number;
}

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalBatches: number;
  activeBatches: number;
  totalRevenue: number;
  pendingRevenue: number;
  totalEnrollments: number;
  recentMonths: MonthlyStats[];
  batchOccupancy: BatchOccupancy[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPKR(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  bg,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  bg: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-[#94a3b8] font-medium">{label}</p>
          <p className="text-[20px] font-bold mt-0.5 truncate" style={{ color }}>
            {value}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: bg }}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ color }}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: apiGet<AnalyticsData>('/admin/analytics'),
  });

  if (isLoading) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <LogoSpinner message="Loading analytics…" py="py-32" />
      </DashboardShell>
    );
  }

  if (isError || !data) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex items-center justify-center py-32 text-[#94a3b8]">
          <span className="material-symbols-outlined text-[24px] mr-2">error</span>
          <p className="text-[13px]">Failed to load analytics.</p>
        </div>
      </DashboardShell>
    );
  }

  const maxRevenue = Math.max(...(data.recentMonths.map((m) => m.revenue)), 1);

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">
            Analytics
          </h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
            Platform overview — students, teachers, revenue and batch occupancy
          </p>
        </div>

        {/* KPI stat cards — 2 cols mobile, 3 cols sm, 6 cols xl */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard
            icon="school"
            label="Total Students"
            value={data.totalStudents}
            bg="#eef2ff"
            color="#6366f1"
          />
          <StatCard
            icon="person"
            label="Total Teachers"
            value={data.totalTeachers}
            bg="#eff6ff"
            color="#2563eb"
          />
          <StatCard
            icon="groups"
            label="Active Batches"
            value={data.activeBatches}
            bg="#f0fdf4"
            color="#16a34a"
          />
          <StatCard
            icon="payments"
            label="Total Revenue"
            value={fmtPKR(data.totalRevenue)}
            bg="#f0fdf4"
            color="#16a34a"
          />
          <StatCard
            icon="schedule"
            label="Pending Revenue"
            value={fmtPKR(data.pendingRevenue)}
            bg="#fff7ed"
            color="#c2410c"
          />
          <StatCard
            icon="assignment_turned_in"
            label="Total Enrollments"
            value={data.totalEnrollments}
            bg="#fdf4ff"
            color="#9333ea"
          />
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h2 className="text-[13px] font-semibold text-[#0f172a] mb-1">Monthly Revenue</h2>
          <p className="text-[11px] text-[#94a3b8] mb-5">Last 6 months — collected (PAID)</p>

          <div className="flex items-end gap-3 h-40">
            {data.recentMonths.map((m) => {
              const heightPct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end" style={{ height: '120px' }}>
                    <div
                      className="w-full rounded-t-md bg-[#6366f1] hover:bg-[#4f46e5] transition-colors cursor-default"
                      style={{ height: `${Math.max(heightPct, m.revenue > 0 ? 4 : 0)}%` }}
                      title={fmtPKR(m.revenue)}
                    />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#94a3b8] text-center leading-tight whitespace-nowrap">
                    {m.month}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Y-axis label hint */}
          <p className="text-[10px] text-[#cbd5e1] mt-2 text-right">
            Max: {fmtPKR(maxRevenue)}
          </p>
        </div>

        {/* Batch Occupancy */}
        {data.batchOccupancy.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Batch Occupancy</h2>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Active batches — enrolled vs capacity
              </p>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {data.batchOccupancy.map((b) => {
                const barColor =
                  b.pct >= 80 ? '#22c55e' : b.pct >= 50 ? '#f59e0b' : '#ef4444';
                const textColor =
                  b.pct >= 80 ? '#16a34a' : b.pct >= 50 ? '#d97706' : '#dc2626';
                const badgeBg =
                  b.pct >= 80 ? '#f0fdf4' : b.pct >= 50 ? '#fffbeb' : '#fef2f2';
                return (
                  <div key={b.batchId} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[12px] font-semibold text-[#0f172a] truncate">
                          {b.batchName}
                        </p>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-3 shrink-0"
                          style={{ backgroundColor: badgeBg, color: textColor }}
                        >
                          {b.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(b.pct, 100)}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-1">
                        {b.enrolled} / {b.maxStudents} students
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.batchOccupancy.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-8 text-center">
            <span className="material-symbols-outlined text-[32px] text-[#e2e8f0]">groups</span>
            <p className="text-[12px] text-[#94a3b8] mt-2">No active batches to display.</p>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
