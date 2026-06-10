import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api, { apiGet } from '../lib/api';
import { LEAD_STATUS_META } from '../lib/statusMeta';

type StatusFilter = 'ALL' | 'NEW' | 'CONTACTED' | 'ENROLLED' | 'CLOSED';

interface Lead {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  interestedCourse: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

interface Counts {
  NEW: number;
  CONTACTED: number;
  ENROLLED: number;
  CLOSED: number;
}

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'ENROLLED', label: 'Enrolled' },
  { key: 'CLOSED', label: 'Closed' },
];

const STATUSES: StatusFilter[] = ['NEW', 'CONTACTED', 'ENROLLED', 'CLOSED'];

function StatusBadge({ status }: { status: string }) {
  const meta = LEAD_STATUS_META[status] ?? LEAD_STATUS_META.CLOSED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminLeadsPage() {
  const [tab, setTab] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-leads'] });
    qc.invalidateQueries({ queryKey: ['admin-lead-counts'] });
  };

  const { data: leads = [], isLoading, isError } = useQuery<Lead[]>({
    queryKey: ['admin-leads', tab],
    queryFn: async () => {
      const params = tab !== 'ALL' ? `?status=${tab}` : '';
      const { data } = await api.get(`/admin/leads${params}`);
      return data;
    },
  });

  const { data: counts } = useQuery<Counts>({
    queryKey: ['admin-lead-counts'],
    queryFn: apiGet('/admin/leads/counts'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: number; value: string }) =>
      api.put(`/admin/leads/${id}/status?value=${value}`),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/leads/${id}`),
    onSuccess: () => { invalidate(); setDeleteConfirm(null); },
  });

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.includes(q)
    );
  });

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-[20px] sm:text-[28px] leading-tight sm:leading-[36px] font-semibold text-[#070235]">
            Leads
          </h1>
          <p className="text-[11px] sm:text-sm text-[#505f76] mt-0.5 sm:mt-1">
            Enquiries submitted through the public contact form.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex gap-1 bg-white border border-[#c8c5d0] rounded-xl p-1 w-fit min-w-full sm:min-w-0">
            {TABS.map((t) => {
              const count = t.key !== 'ALL' ? (counts?.[t.key] ?? 0) : null;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearch(''); }}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    tab === t.key
                      ? 'bg-[#070235] text-white shadow-sm'
                      : 'text-[#505f76] hover:bg-[#f2f3ff] hover:text-[#070235]'
                  }`}
                >
                  {t.label}
                  {count !== null && count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      tab === t.key ? 'bg-white/20 text-white' : LEAD_STATUS_META[t.key]?.bg + ' ' + LEAD_STATUS_META[t.key]?.text
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#787680]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full sm:max-w-sm pl-10 pr-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
          />
        </div>

        {/* ── Desktop table (sm+) ── */}
        <div className="hidden sm:block bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-[#787680]">
              <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
              Loading leads…
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-20 text-[#93000a]">
              <span className="material-symbols-outlined text-[24px] mr-2">error</span>
              Failed to load leads.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c8c5d0] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
              <p className="text-sm text-[#787680]">{search ? 'No leads match your search.' : 'No leads yet.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e4e2e6] bg-[#faf8ff]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Course</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Message</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#505f76] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e2e6]">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#faf8ff] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#131b2e]">{lead.fullName}</p>
                      <p className="text-xs text-[#787680]">{lead.email}</p>
                    </td>
                    <td className="px-5 py-4 text-[#505f76]">{lead.phone}</td>
                    <td className="px-5 py-4 text-[#505f76]">{lead.interestedCourse ?? '—'}</td>
                    <td className="px-5 py-4 max-w-[200px]">
                      {lead.message ? (
                        <p className="text-[#505f76] truncate text-xs" title={lead.message}>{lead.message}</p>
                      ) : (
                        <span className="text-[#c8c5d0]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-4 text-[#505f76] text-xs whitespace-nowrap">
                      {lead.createdAt ? formatDate(lead.createdAt) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={lead.status}
                          onChange={(e) => statusMutation.mutate({ id: lead.id, value: e.target.value })}
                          disabled={statusMutation.isPending}
                          className="text-xs border border-[#c8c5d0] rounded-lg px-2 py-1.5 bg-white text-[#131b2e] focus:outline-none focus:border-[#070235] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
                          ))}
                        </select>
                        {deleteConfirm === lead.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteMutation.mutate(lead.id)} disabled={deleteMutation.isPending}
                              className="px-2 py-1.5 text-xs bg-[#ba1a1a] text-white rounded-lg font-semibold hover:bg-[#93000a] transition-colors disabled:opacity-50">
                              Confirm
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1.5 text-xs border border-[#c8c5d0] text-[#505f76] rounded-lg hover:bg-[#f2f3ff] transition-colors">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(lead.id)}
                            className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Mobile cards (< sm) ── */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <div className="bg-white border border-[#c8c5d0] rounded-xl flex items-center justify-center py-16 text-[#787680]">
              <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
              Loading leads…
            </div>
          ) : isError ? (
            <div className="bg-white border border-[#c8c5d0] rounded-xl flex items-center justify-center py-16 text-[#93000a]">
              <span className="material-symbols-outlined text-[24px] mr-2">error</span>
              Failed to load leads.
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-[#c8c5d0] rounded-xl flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c8c5d0] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
              <p className="text-sm text-[#787680]">{search ? 'No leads match your search.' : 'No leads yet.'}</p>
            </div>
          ) : (
            filtered.map((lead) => (
              <div key={lead.id} className="bg-white border border-[#c8c5d0] rounded-xl p-3 space-y-2">

                {/* Name + date + status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold text-[#131b2e]">{lead.fullName}</p>
                    <p className="text-[10px] text-[#787680] mt-0.5">{lead.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={lead.status} />
                    <p className="text-[10px] text-[#787680] mt-1">{lead.createdAt ? formatDate(lead.createdAt) : '—'}</p>
                  </div>
                </div>

                {/* Phone + Course */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#505f76]">
                    <span className="material-symbols-outlined text-[12px] text-[#c8c5d0]">call</span>
                    {lead.phone}
                  </span>
                  {lead.interestedCourse && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#505f76]">
                      <span className="material-symbols-outlined text-[12px] text-[#c8c5d0]">menu_book</span>
                      {lead.interestedCourse}
                    </span>
                  )}
                </div>

                {/* Message */}
                {lead.message && (
                  <p className="text-[10px] text-[#505f76] bg-[#faf8ff] rounded-lg px-2.5 py-1.5 line-clamp-2">
                    {lead.message}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[#f1f0f4]">
                  <select
                    value={lead.status}
                    onChange={(e) => statusMutation.mutate({ id: lead.id, value: e.target.value })}
                    disabled={statusMutation.isPending}
                    className="text-[10px] border border-[#c8c5d0] rounded-lg px-2 py-1 bg-white text-[#131b2e] focus:outline-none focus:border-[#070235] disabled:opacity-50 cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
                    ))}
                  </select>

                  {deleteConfirm === lead.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteMutation.mutate(lead.id)} disabled={deleteMutation.isPending}
                        className="px-2 py-1 text-[10px] bg-[#ba1a1a] text-white rounded-lg font-semibold disabled:opacity-50">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-[10px] border border-[#c8c5d0] text-[#505f76] rounded-lg">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(lead.id)}
                      className="p-1.5 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && !isError && filtered.length > 0 && (
          <p className="mt-3 text-xs text-[#787680]">
            Showing {filtered.length} of {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
