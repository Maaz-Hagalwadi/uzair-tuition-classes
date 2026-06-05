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

function joinedAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Create Modal ───────────────────────────────────────────────────────────────
interface ModalProps { role: Tab; onClose: () => void; onSuccess: () => void; }

function CreateUserModal({ role, onClose, onSuccess }: ModalProps) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const endpoint = role === 'TEACHER' ? '/admin/users/teachers' : '/admin/users/students';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(endpoint, form);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function field(label: string, key: keyof CreateForm, type = 'text', required = true) {
    return (
      <div>
        <label className="block text-xs font-semibold text-[#47464f] mb-1">
          {label}{required && <span className="text-[#ba1a1a] ml-0.5">*</span>}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          required={required}
          className="w-full px-3 py-2.5 rounded-xl border border-[#c8c5d0] text-sm text-[#131b2e] bg-[#faf8ff] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#c8c5d0]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8eaf0]">
          <div>
            <h2 className="text-[17px] font-bold text-[#070235]" style={{ fontFamily: "'Source Serif 4', serif" }}>
              Register New {role === 'TEACHER' ? 'Teacher' : 'Student'}
            </h2>
            <p className="text-xs text-[#47464f] mt-0.5">Account will be active immediately</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f2f3ff] text-[#787680]">
            <span className="material-symbols-outlined text-[20px]">close</span>
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
          {error && (
            <p className="text-xs text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">{error}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#c8c5d0] text-sm font-medium text-[#47464f] hover:bg-[#f2f3ff] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#070235] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95">
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
  const [tab, setTab] = useState<Tab>('TEACHER');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: users = [], isLoading, isError } = useQuery<UserRecord[]>({
    queryKey: ['admin-users', tab],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users?role=${tab}`);
      return data;
    },
  });

  // for tab counts we also fetch the other tab silently
  const { data: otherUsers = [] } = useQuery<UserRecord[]>({
    queryKey: ['admin-users', tab === 'TEACHER' ? 'STUDENT' : 'TEACHER'],
    queryFn: async () => {
      const other = tab === 'TEACHER' ? 'STUDENT' : 'TEACHER';
      const { data } = await api.get(`/admin/users?role=${other}`);
      return data;
    },
  });

  const teacherCount = tab === 'TEACHER' ? users.length : otherUsers.length;
  const studentCount = tab === 'STUDENT' ? users.length : otherUsers.length;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.put(`/admin/users/${id}/deactivate`),
    onSuccess: invalidate,
  });
  const activateMutation = useMutation({
    mutationFn: (id: number) => api.put(`/admin/users/${id}/activate`),
    onSuccess: invalidate,
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const isBusy = deactivateMutation.isPending || activateMutation.isPending;

  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = users.filter(u => !u.active).length;
  const newThisMonth = users.filter(u => {
    const d = new Date(u.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-7xl">

        {/* ── Hero Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[32px] leading-[40px] font-semibold text-[#070235]"
              style={{ fontFamily: "'Source Serif 4', serif" }}>
              User Management
            </h2>
            <p className="text-[#47464f] text-[15px] mt-1 leading-relaxed">
              Organize, monitor, and manage the educational ecosystem for teachers and students.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#070235] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register New User
          </button>
        </div>

        {/* ── Controls Card ── */}
        <div className="bg-white rounded-2xl border border-[#c8c5d0] p-5 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Tabs */}
            <div className="flex p-1 bg-[#e2e7ff] rounded-xl w-fit gap-1">
              {([['TEACHER', 'cast_for_education', teacherCount], ['STUDENT', 'school', studentCount]] as const).map(([t, icon, count]) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(''); }}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t
                      ? 'bg-white text-[#070235] shadow-sm'
                      : 'text-[#47464f] hover:bg-[#eaedff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]"
                    style={tab === t ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {icon}
                  </span>
                  {t === 'TEACHER' ? 'Teachers' : 'Students'}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t ? 'bg-[#eaedff] text-[#070235]' : 'bg-[#c8c5d0] text-[#47464f]'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search + actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#f2f3ff] border border-[#c8c5d0] rounded-full px-4 py-2">
                <span className="material-symbols-outlined text-[16px] text-[#787680]">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab === 'TEACHER' ? 'teachers' : 'students'}…`}
                  className="bg-transparent border-none focus:outline-none text-sm text-[#131b2e] placeholder-[#787680] w-44"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-[#c8c5d0] text-[#47464f] rounded-lg text-sm hover:bg-[#f2f3ff] transition-colors">
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* ── Data Table ── */}
        <div className="bg-white rounded-2xl border border-[#c8c5d0] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-[#787680]">
              <span className="material-symbols-outlined text-[22px] animate-spin mr-2">sync</span>
              <span className="text-sm">Loading users…</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-20 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[22px] mr-2">error</span>
              <span className="text-sm">Failed to load users.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="material-symbols-outlined text-[48px] text-[#c8c5d0] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
              <p className="text-sm text-[#787680]">
                {search ? 'No users match your search.' : `No ${tab === 'TEACHER' ? 'teachers' : 'students'} yet.`}
              </p>
              {!search && (
                <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-[#5b598c] font-semibold hover:underline">
                  Register one →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#070235] text-white">
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">USER PROFILE</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider hidden sm:table-cell">CONTACT</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">STATUS</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider hidden md:table-cell">DATE JOINED</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c8c5d0]/40">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f2f3ff] transition-colors group">

                      {/* User profile */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-full bg-[#d0e1fb] border-2 border-[#e2e7ff] group-hover:border-[#070235] transition-all flex items-center justify-center">
                              <span className="text-[13px] font-bold text-[#070235]">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.active ? 'bg-green-500' : 'bg-[#787680]'}`} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#131b2e]">{user.firstName} {user.lastName}</p>
                            <p className="text-[12px] text-[#47464f]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-[#131b2e]">
                          <span className="material-symbols-outlined text-[16px] text-[#47464f]">phone</span>
                          <span className="text-[13px]">{user.phone ?? '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold border border-green-200">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2e7ff] text-[#47464f] text-[11px] font-bold border border-[#c8c5d0]">
                            <span className="w-1.5 h-1.5 bg-[#787680] rounded-full" />
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {/* Date joined */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-[13px] text-[#131b2e] font-medium">{user.createdAt ? formatDate(user.createdAt) : '—'}</p>
                        {user.createdAt && (
                          <p className="text-[11px] text-[#47464f] mt-0.5">Joined {joinedAgo(user.createdAt)}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {user.active ? (
                            <button
                              onClick={() => deactivateMutation.mutate(user.id)}
                              disabled={isBusy}
                              title="Deactivate"
                              className="p-2 text-[#47464f] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 transition-all rounded-lg disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => activateMutation.mutate(user.id)}
                              disabled={isBusy}
                              title="Activate"
                              className="p-2 text-[#47464f] hover:text-[#070235] hover:bg-[#eaedff] transition-all rounded-lg disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            </button>
                          )}
                          <button
                            title="More options"
                            className="p-2 text-[#47464f] hover:text-[#070235] hover:bg-[#eaedff] transition-all rounded-lg"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="px-6 py-4 bg-white border-t border-[#c8c5d0]/40 flex items-center justify-between">
              <p className="text-[12px] text-[#47464f]">
                Showing <span className="font-bold text-[#131b2e]">{filtered.length}</span> of{' '}
                <span className="font-bold text-[#131b2e]">{users.length}</span>{' '}
                {tab === 'TEACHER' ? 'Teachers' : 'Students'}
              </p>
              <div className="flex gap-1.5">
                <button className="px-3 py-1.5 border border-[#c8c5d0] rounded-lg text-[#47464f] hover:bg-[#f2f3ff] transition-all disabled:opacity-30 text-[12px]" disabled>
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button className="px-4 py-1.5 bg-[#070235] text-white rounded-lg text-[12px] font-bold">1</button>
                <button className="px-3 py-1.5 border border-[#c8c5d0] rounded-lg text-[#47464f] hover:bg-[#f2f3ff] transition-all text-[12px]">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="bg-[#1e1b4b] p-6 rounded-2xl border border-[#070235]/20 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-white/70 text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
              <span className="text-green-400 font-bold flex items-center gap-0.5 text-[11px]">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>
                +{newThisMonth} this month
              </span>
            </div>
            <p className="text-[#8683ba] text-[12px] font-medium uppercase tracking-wide">New {tab === 'TEACHER' ? 'Teachers' : 'Students'}</p>
            <h4 className="text-white text-[28px] font-bold mt-1" style={{ fontFamily: "'Source Serif 4', serif" }}>
              {newThisMonth} Added
            </h4>
          </div>

          <div className="bg-[#f2f3ff] p-6 rounded-2xl border border-[#c8c5d0]">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-[#070235] text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            </div>
            <p className="text-[#47464f] text-[12px] font-medium uppercase tracking-wide">Active Accounts</p>
            <h4 className="text-[#070235] text-[28px] font-bold mt-1" style={{ fontFamily: "'Source Serif 4', serif" }}>
              {activeCount} Active
            </h4>
          </div>

          <div className="bg-[#d0e1fb] p-6 rounded-2xl border border-[#b7c8e1]/30">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-[#38485d] text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
            </div>
            <p className="text-[#38485d]/80 text-[12px] font-medium uppercase tracking-wide">Inactive Accounts</p>
            <h4 className="text-[#38485d] text-[28px] font-bold mt-1" style={{ fontFamily: "'Source Serif 4', serif" }}>
              {inactiveCount} Inactive
            </h4>
          </div>
        </div>

      </div>

      {showCreate && (
        <CreateUserModal role={tab} onClose={() => setShowCreate(false)} onSuccess={invalidate} />
      )}
    </DashboardShell>
  );
}
