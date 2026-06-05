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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1e1b4b]">Payments</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Your fee payment history</p>
        </div>

        {/* Summary cards */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-[#e4e2e6] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[16px] text-[#c2410c]">schedule</span>
                <p className="text-xs text-[#9ca3af]">Outstanding</p>
              </div>
              <p className="text-xl font-bold text-[#c2410c]">{fmtAmount(totalPending)}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e4e2e6] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">check_circle</span>
                <p className="text-xs text-[#9ca3af]">Total Paid</p>
              </div>
              <p className="text-xl font-bold text-[#16a34a]">{fmtAmount(totalPaid)}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#6b7280]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
            <span className="material-symbols-outlined text-[48px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            <p className="text-sm font-medium">No payment records yet</p>
            <p className="text-xs mt-1">Your fee records will appear here once added by admin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => {
              const meta = STATUS_META[p.status] ?? STATUS_META.PENDING;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-[#e4e2e6] p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.bg }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: meta.text }}>
                      {meta.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#374151] text-sm">{p.batchName}</p>
                        <p className="text-xs text-[#9ca3af] mt-0.5">
                          {p.paymentDate ? `Paid on ${fmtDate(p.paymentDate)}` : `Added ${fmtDate(p.createdAt)}`}
                        </p>
                        {p.notes && <p className="text-xs text-[#6b7280] mt-1">{p.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[#1e1b4b] text-base">{fmtAmount(p.amount)}</p>
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
