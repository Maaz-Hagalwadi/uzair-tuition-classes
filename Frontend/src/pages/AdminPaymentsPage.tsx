import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';

interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  batchId: number;
  batchName: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface User { id: number; firstName: string; lastName: string; email: string; roles: string[]; }
interface Batch { id: number; name: string; courseName: string; }

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pending', bg: '#fff7ed', text: '#c2410c' },
  PAID:    { label: 'Paid',    bg: '#f0fdf4', text: '#16a34a' },
  OVERDUE: { label: 'Overdue', bg: '#fef2f2', text: '#dc2626' },
  WAIVED:  { label: 'Waived',  bg: '#f3f4f6', text: '#6b7280' },
};
const VALID_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'WAIVED'];

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtAmount(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);
}

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => { const { data } = await api.get('/admin/users'); return data; },
  });
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['admin-batches'],
    queryFn: async () => { const { data } = await api.get('/admin/batches'); return data; },
  });

  const students = users.filter(u => u.roles.includes('STUDENT'));

  async function handleSubmit() {
    if (!studentId || !batchId || !amount) return;
    setSaving(true); setError('');
    try {
      await api.post('/admin/payments', {
        studentId: Number(studentId),
        batchId: Number(batchId),
        amount: parseFloat(amount),
        status,
        paymentDate: paymentDate || null,
        notes: notes.trim() || null,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create payment.');
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = studentId && batchId && amount && !saving;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">Add Payment Record</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <span className="material-symbols-outlined text-[14px]">error</span>{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Student *</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30">
              <option value="">Select student…</option>
              {students.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Batch *</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30">
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.courseName})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Amount (PKR) *</label>
              <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30">
                {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Payment Date</label>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {saving ? 'Saving…' : 'Add Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['admin-payments', filter],
    queryFn: async () => {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/payments${params}`);
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/admin/payments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payments'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payments'] }),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(p =>
      p.studentName.toLowerCase().includes(q) ||
      p.batchName.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'ALL',     label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'PAID',    label: 'Paid' },
    { key: 'OVERDUE', label: 'Overdue' },
    { key: 'WAIVED',  label: 'Waived' },
  ];

  const totals = useMemo(() => ({
    pending: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0),
    paid:    payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
  }), [payments]);

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#1e1b4b]">Payments</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Track student fee payments</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90">
            <span className="material-symbols-outlined text-[16px]">add</span>Add Payment
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#e4e2e6] p-4">
            <p className="text-xs text-[#9ca3af] mb-1">Total Pending</p>
            <p className="text-xl font-bold text-[#c2410c]">{fmtAmount(totals.pending)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e4e2e6] p-4">
            <p className="text-xs text-[#9ca3af] mb-1">Total Collected</p>
            <p className="text-xl font-bold text-[#16a34a]">{fmtAmount(totals.paid)}</p>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1 bg-[#f3f4f6] p-1 rounded-lg w-fit">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === t.key ? 'bg-white text-[#1e1b4b] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#9ca3af]">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student or batch…"
              className="w-full pl-9 pr-4 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#6b7280]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
            <span className="material-symbols-outlined text-[48px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            <p className="text-sm font-medium">No payment records</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e4e2e6] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9fafb] text-[#9ca3af] text-xs uppercase tracking-wide border-b border-[#f3f4f6]">
                  <th className="text-left px-5 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Batch</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map(p => {
                  const meta = STATUS_META[p.status] ?? STATUS_META.PENDING;
                  return (
                    <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#374151]">{p.studentName}</p>
                      </td>
                      <td className="px-4 py-3 text-[#6b7280] text-xs hidden sm:table-cell">{p.batchName}</td>
                      <td className="px-4 py-3 font-semibold text-[#1e1b4b]">{fmtAmount(p.amount)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={p.status}
                          onChange={e => updateStatusMutation.mutate({ id: p.id, status: e.target.value })}
                          className="text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 cursor-pointer"
                          style={{ backgroundColor: meta.bg, color: meta.text }}
                        >
                          {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#9ca3af] hidden md:table-cell">{fmtDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-xs text-[#6b7280] hidden lg:table-cell max-w-[150px] truncate">{p.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { if (window.confirm('Delete this payment record?')) deleteMutation.mutate(p.id); }}
                          className="text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['admin-payments'] })}
        />
      )}
    </DashboardShell>
  );
}
