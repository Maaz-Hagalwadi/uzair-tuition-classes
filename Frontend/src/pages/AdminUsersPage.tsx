import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

type Tab = 'TEACHER' | 'STUDENT';

interface UserRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roles: string[];
  active: boolean;
  emailVerified: boolean;
  approvalStatus: string | null;
  createdAt: string;
}

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

const EMPTY_FORM: CreateForm = { firstName: '', lastName: '', email: '', password: '', phone: '' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Create Modal ───────────────────────────────────────────────────────────────
function CreateUserModal({ role, onClose, onSuccess }: { role: Tab; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(role === 'TEACHER' ? '/admin/users/teachers' : '/admin/users/students', form);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  }

  function field(label: string, key: keyof CreateForm, type = 'text', required = true) {
    return (
      <div>
        <label className="block text-[12px] font-semibold text-[#374151] mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required={required}
          className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10 transition-all"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#e2e8f0]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[15px] font-bold text-[#111827]">
              Register New {role === 'TEACHER' ? 'Teacher' : 'Student'}
            </h2>
            <p className="text-[12px] text-[#6b7280] mt-0.5">Account will be active immediately</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af]">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field('First Name', 'firstName')}
            {field('Last Name', 'lastName')}
          </div>
          {field('Email Address', 'email', 'email')}
          {field('Password', 'password', 'password')}
          {field('Phone', 'phone', 'tel', false)}
          {error && <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] font-medium text-[#6b7280] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#1d4ed8] text-white text-[13px] font-semibold hover:bg-[#1e40af] disabled:opacity-50 transition-all">
              {loading ? 'Creating…' : `Create ${role === 'TEACHER' ? 'Teacher' : 'Student'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [tab, setTab]           = useState<Tab>('TEACHER');
  const [search, setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ['admin-users', tab],
    queryFn: async () => (await api.get(`/admin/users?role=${tab}`)).data,
  });

  const { data: otherUsers = [] } = useQuery<UserRecord[]>({
    queryKey: ['admin-users', tab === 'TEACHER' ? 'STUDENT' : 'TEACHER'],
    queryFn: async () => (await api.get(`/admin/users?role=${tab === 'TEACHER' ? 'STUDENT' : 'TEACHER'}`)).data,
  });

  const teacherCount = tab === 'TEACHER' ? users.length : otherUsers.length;
  const studentCount = tab === 'STUDENT' ? users.length : otherUsers.length;


  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const deactivate = useMutation({ mutationFn: (id: number) => api.put(`/admin/users/${id}/deactivate`), onSuccess: invalidate });
  const activate   = useMutation({ mutationFn: (id: number) => api.put(`/admin/users/${id}/activate`),   onSuccess: invalidate });
  const isBusy     = deactivate.isPending || activate.isPending;

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#111827] leading-tight">User Management</h1>
            <p className="text-[11px] sm:text-[13px] text-[#6b7280] mt-0.5">Oversee, verify, and manage teachers and students</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-fit self-end sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1d4ed8] text-white text-[12px] sm:text-[13px] font-semibold hover:bg-[#1e40af] transition-all"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">person_add</span>
            Register New User
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Teachers */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px] sm:text-[18px] text-[#1d4ed8]" style={{ fontVariationSettings: "'FILL' 1" }}>cast_for_education</span>
              </div>
            </div>
            <p className="text-[22px] sm:text-[30px] font-black text-[#111827] leading-none">{teacherCount}</p>
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#6b7280] mt-1">Teachers</p>
          </div>

          {/* Students */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px] sm:text-[18px] text-[#16a34a]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
            </div>
            <p className="text-[22px] sm:text-[30px] font-black text-[#111827] leading-none">{studentCount}</p>
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#6b7280] mt-1">Students</p>
          </div>

          {/* Platform Growth */}
          <div className="rounded-2xl p-3 sm:p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)' }}>
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[60px] sm:text-[80px] text-white/10 select-none" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2 sm:mb-3">
              <span className="material-symbols-outlined text-[15px] sm:text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <p className="text-[22px] sm:text-[28px] font-black text-white leading-none">{teacherCount + studentCount}</p>
            <p className="text-[11px] sm:text-[12px] font-semibold text-white/70 mt-1">Total Users</p>
          </div>
        </div>

        {/* ── Controls (shared) ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              {([['TEACHER', 'Teachers', teacherCount], ['STUDENT', 'Students', studentCount]] as const).map(([t, label, count]) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(''); }}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                    tab === t ? 'bg-[#1d4ed8] text-white' : 'text-[#6b7280] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#9ca3af]'
                  }`}>{count}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[14px] text-[#9ca3af]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tab === 'TEACHER' ? 'teachers' : 'students'}…`}
                className="pl-8 pr-3 py-2 text-[12px] rounded-xl border border-[#e2e8f0] bg-[#f8f9fa] w-full sm:w-56 focus:outline-none focus:border-[#1d4ed8] focus:bg-white focus:ring-2 focus:ring-[#1d4ed8]/10 transition-all"
              />
            </div>
          </div>

          {/* ── Desktop table (sm+) ── */}
          <div className="hidden sm:block">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
                <span className="text-[13px]">Loading users…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[40px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
                <p className="text-[13px] font-semibold text-[#374151]">
                  {search ? 'No users match your search' : `No ${tab === 'TEACHER' ? 'teachers' : 'students'} yet`}
                </p>
                {!search && (
                  <button onClick={() => setShowCreate(true)} className="mt-2 text-[12px] text-[#1d4ed8] font-semibold hover:underline">
                    Register one →
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Name & Email</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Role</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Joined</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filtered.map(user => {
                    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                    return (
                      <tr key={user.id} className="hover:bg-[#fafbff] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0">
                              <span className="text-[12px] font-bold text-[#1d4ed8]">{initials}</span>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#111827]">{user.firstName} {user.lastName}</p>
                              <p className="text-[11px] text-[#6b7280]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex px-2.5 py-1 rounded-full border border-[#e2e8f0] text-[11px] font-semibold text-[#374151] bg-white">
                            {tab === 'TEACHER' ? 'Teacher' : 'Student'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#16a34a]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#9ca3af]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <p className="text-[12px] text-[#374151]">{user.createdAt ? formatDate(user.createdAt) : '—'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {user.active ? (
                              <button onClick={() => deactivate.mutate(user.id)} disabled={isBusy} title="Deactivate"
                                className="p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40">
                                <span className="material-symbols-outlined text-[17px]">block</span>
                              </button>
                            ) : (
                              <button onClick={() => activate.mutate(user.id)} disabled={isBusy} title="Activate"
                                className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#16a34a] hover:bg-[#f0fdf4] transition-all disabled:opacity-40">
                                <span className="material-symbols-outlined text-[17px]">check_circle</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-[#f1f5f9]">
                <p className="text-[12px] text-[#9ca3af]">
                  Showing {filtered.length} of {users.length} {tab === 'TEACHER' ? 'teachers' : 'students'}
                </p>
              </div>
            )}
          </div>

          {/* ── Mobile cards (< sm) ── */}
          <div className="sm:hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
                <span className="text-[13px]">Loading users…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[40px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
                <p className="text-[13px] font-semibold text-[#374151]">
                  {search ? 'No users match your search' : `No ${tab === 'TEACHER' ? 'teachers' : 'students'} yet`}
                </p>
                {!search && (
                  <button onClick={() => setShowCreate(true)} className="mt-2 text-[12px] text-[#1d4ed8] font-semibold hover:underline">
                    Register one →
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {filtered.map(user => {
                  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                  return (
                    <div key={user.id} className="px-4 py-3 space-y-2">
                      {/* Avatar + name + action */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-[#1d4ed8]">{initials}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-[#111827]">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] text-[#6b7280] mt-0.5">{user.email}</p>
                          </div>
                        </div>
                        {user.active ? (
                          <button onClick={() => deactivate.mutate(user.id)} disabled={isBusy}
                            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40 shrink-0">
                            <span className="material-symbols-outlined text-[16px]">block</span>
                          </button>
                        ) : (
                          <button onClick={() => activate.mutate(user.id)} disabled={isBusy}
                            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#16a34a] hover:bg-[#f0fdf4] transition-all disabled:opacity-40 shrink-0">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          </button>
                        )}
                      </div>

                      {/* Role + Status + Joined */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full border border-[#e2e8f0] text-[10px] font-semibold text-[#374151] bg-white">
                          {tab === 'TEACHER' ? 'Teacher' : 'Student'}
                        </span>
                        {user.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[10px] font-semibold text-[#16a34a]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f9fafb] text-[10px] font-semibold text-[#9ca3af]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]" />
                            Inactive
                          </span>
                        )}
                        {user.createdAt && (
                          <span className="text-[10px] text-[#94a3b8]">Joined {formatDate(user.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="px-5 py-3">
                  <p className="text-[12px] text-[#9ca3af]">
                    Showing {filtered.length} of {users.length} {tab === 'TEACHER' ? 'teachers' : 'students'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {showCreate && (
        <CreateUserModal role={tab} onClose={() => setShowCreate(false)} onSuccess={invalidate} />
      )}
    </DashboardShell>
  );
}
