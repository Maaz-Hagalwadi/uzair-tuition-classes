import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface Payment {
  id: number;
  batchId: number;
  batchName: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  PENDING: { label: 'Pending', bg: '#fff7ed', text: '#c2410c', icon: 'schedule' },
  PAID:    { label: 'Paid',    bg: '#f0fdf4', text: '#16a34a', icon: 'check_circle' },
  OVERDUE: { label: 'Overdue', bg: '#fef2f2', text: '#dc2626', icon: 'warning' },
  WAIVED:  { label: 'Waived',  bg: '#f3f4f6', text: '#6b7280', icon: 'do_not_disturb_on' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtAmount(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);
}

export default function StudentPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['student-payments'],
    queryFn: async () => { const { data } = await api.get('/student/payments'); return data; },
  });

  const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE');
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Payments</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Your fee payment history</p>
        </div>

        {/* Summary cards */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[15px] text-[#c2410c]">schedule</span>
                <p className="text-[11px] text-[#94a3b8]">Outstanding</p>
              </div>
              <p className="text-[16px] sm:text-xl font-bold text-[#c2410c]">{fmtAmount(totalPending)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[15px] text-[#16a34a]">check_circle</span>
                <p className="text-[11px] text-[#94a3b8]">Total Paid</p>
              </div>
              <p className="text-[16px] sm:text-xl font-bold text-[#16a34a]">{fmtAmount(totalPaid)}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading…</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            <p className="text-[13px] font-medium">No payment records yet</p>
            <p className="text-[11px] mt-1">Your fee records will appear here once added by admin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => {
              const meta = STATUS_META[p.status] ?? STATUS_META.PENDING;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.bg }}>
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]" style={{ color: meta.text }}>
                      {meta.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[12px] sm:text-[13px] font-semibold text-[#374151]">{p.batchName}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">
                          {p.paymentDate ? `Paid on ${fmtDate(p.paymentDate)}` : `Added ${fmtDate(p.createdAt)}`}
                        </p>
                        {p.notes && <p className="text-[11px] text-[#6b7280] mt-1">{p.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] sm:text-[15px] font-bold text-[#0f172a]">{fmtAmount(p.amount)}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: meta.bg, color: meta.text }}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
