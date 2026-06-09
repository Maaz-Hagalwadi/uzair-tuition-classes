import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  batchId: number;
  batchName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface EnrollmentRequest {
  id: number;
  studentName: string;
  batchId: number;
  batchName: string;
  status: string;
  createdAt: string;
}

interface LeadCounts {
  NEW: number;
  CONTACTED: number;
  ENROLLED: number;
  CLOSED: number;
}

interface AttendanceSummary {
  batchId: number;
  batchName: string;
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

function fmtPKR(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);
}

function StatCard({ icon, label, value, sub, bg, color }: {
  icon: string; label: string; value: string | number; sub?: string; bg: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-[#94a3b8] font-medium">{label}</p>
          <p className="text-[22px] font-bold mt-0.5" style={{ color }}>{value}</p>
          {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const { data: payments = [], isLoading: pl } = useQuery<Payment[]>({
    queryKey: ['admin-payments'],
    queryFn: async () => (await api.get('/admin/payments')).data,
  });

  const { data: enrollments = [], isLoading: el } = useQuery<EnrollmentRequest[]>({
    queryKey: ['admin-enrollments'],
    queryFn: async () => (await api.get('/admin/enrollments')).data,
  });

  const { data: leadCounts } = useQuery<LeadCounts>({
    queryKey: ['admin-lead-counts'],
    queryFn: async () => (await api.get('/admin/leads/counts')).data,
  });

  const { data: attendance = [], isLoading: al } = useQuery<AttendanceSummary[]>({
    queryKey: ['admin-attendance-summary'],
    queryFn: async () => (await api.get('/admin/attendance/summary')).data,
  });

  const isLoading = pl || el || al;

  const revenue = useMemo(() => {
    const paid    = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
    const overdue = payments.filter(p => p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0);
    const total   = payments.reduce((s, p) => s + p.amount, 0);
    return { paid, pending, overdue, total };
  }, [payments]);

  const byBatch = useMemo(() => {
    const map = new Map<number, { name: string; paid: number; pending: number; overdue: number; total: number }>();
    for (const p of payments) {
      const e = map.get(p.batchId) ?? { name: p.batchName, paid: 0, pending: 0, overdue: 0, total: 0 };
      e.total += p.amount;
      if (p.status === 'PAID')    e.paid    += p.amount;
      if (p.status === 'PENDING') e.pending += p.amount;
      if (p.status === 'OVERDUE') e.overdue += p.amount;
      map.set(p.batchId, e);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [payments]);

  const enrollStats = useMemo(() => ({
    approved: enrollments.filter(e => e.status === 'APPROVED').length,
    pending:  enrollments.filter(e => e.status === 'PENDING').length,
    rejected: enrollments.filter(e => e.status === 'REJECTED').length,
    total:    enrollments.length,
  }), [enrollments]);

  const overallAttendance = useMemo(() => {
    if (!attendance.length) return 0;
    const total   = attendance.reduce((a, s) => a + s.totalSessions, 0);
    const present = attendance.reduce((a, s) => a + s.present + s.late, 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [attendance]);

  if (isLoading) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex items-center justify-center py-32 text-[#94a3b8]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
          <p className="text-[13px]">Loading reports…</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Reports</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Revenue, enrollments, leads, and attendance overview</p>
        </div>

        {/* Revenue KPIs */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">Revenue</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon="payments"  label="Total Collected" value={fmtPKR(revenue.paid)}    sub={`${payments.filter(p => p.status === 'PAID').length} payments`}    bg="#f0fdf4" color="#16a34a" />
            <StatCard icon="schedule"  label="Outstanding"     value={fmtPKR(revenue.pending)} sub={`${payments.filter(p => p.status === 'PENDING').length} pending`}   bg="#fff7ed" color="#c2410c" />
            <StatCard icon="warning"   label="Overdue"         value={fmtPKR(revenue.overdue)} sub={`${payments.filter(p => p.status === 'OVERDUE').length} overdue`}   bg="#fef2f2" color="#dc2626" />
            <StatCard icon="account_balance" label="Total Invoiced" value={fmtPKR(revenue.total)} sub={`${payments.length} records`} bg="#eef2ff" color="#6366f1" />
          </div>
        </div>

        {/* Revenue by Batch */}
        {byBatch.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Revenue by Batch</h2>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {byBatch.map(b => {
                const paidPct = b.total > 0 ? Math.round((b.paid / b.total) * 100) : 0;
                return (
                  <div key={b.name} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#0f172a] truncate">{b.name}</p>
                      <div className="mt-1.5 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${paidPct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[12px] font-bold text-[#16a34a]">{fmtPKR(b.paid)}</p>
                      {b.pending > 0 && <p className="text-[10px] text-[#c2410c]">{fmtPKR(b.pending)} pending</p>}
                      {b.overdue > 0 && <p className="text-[10px] text-[#dc2626]">{fmtPKR(b.overdue)} overdue</p>}
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a]">
                      {paidPct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enrollments + Leads + Attendance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Enrollments */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Enrollments</h2>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">{enrollStats.total} total requests</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {([
                { label: 'Approved', val: enrollStats.approved, bg: '#f0fdf4', color: '#16a34a' },
                { label: 'Pending',  val: enrollStats.pending,  bg: '#fff7ed', color: '#c2410c' },
                { label: 'Rejected', val: enrollStats.rejected, bg: '#fef2f2', color: '#dc2626' },
              ]).map(({ label, val, bg, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#64748b]">{label}</span>
                  <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: bg, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Funnel */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Lead Funnel</h2>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">Enquiries from the website</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {([
                { label: 'New',       val: leadCounts?.NEW       ?? 0, bg: '#eef2ff', color: '#6366f1' },
                { label: 'Contacted', val: leadCounts?.CONTACTED ?? 0, bg: '#eff6ff', color: '#2563eb' },
                { label: 'Enrolled',  val: leadCounts?.ENROLLED  ?? 0, bg: '#f0fdf4', color: '#16a34a' },
                { label: 'Closed',    val: leadCounts?.CLOSED    ?? 0, bg: '#f3f4f6', color: '#6b7280' },
              ]).map(({ label, val, bg, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#64748b]">{label}</span>
                  <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: bg, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Attendance</h2>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">{overallAttendance}% overall rate</p>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {attendance.length === 0 ? (
                <p className="text-[12px] text-[#94a3b8] text-center py-2">No attendance data yet</p>
              ) : (
                attendance.map(s => (
                  <div key={s.batchId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-[#374151] truncate">{s.batchName}</span>
                      <span className={`text-[10px] font-bold ml-2 shrink-0 ${s.percentage >= 75 ? 'text-[#16a34a]' : s.percentage >= 50 ? 'text-[#d97706]' : 'text-[#dc2626]'}`}>
                        {s.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${s.percentage}%`,
                          backgroundColor: s.percentage >= 75 ? '#22c55e' : s.percentage >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
