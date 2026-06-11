import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

interface LoginRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  ipAddress: string;
  browser: string;
  os: string;
  device: string;
  loggedInAt: string;
}

const DEVICE_ICON: Record<string, string> = {
  Mobile: 'smartphone',
  Tablet: 'tablet',
  Desktop: 'computer',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

export default function AdminLoginHistoryPage() {
  const [search, setSearch] = useState('');

  const { data: logins = [], isLoading } = useQuery<LoginRecord[]>({
    queryKey: ['login-history'],
    queryFn: async () => (await api.get('/admin/login-history')).data,
    refetchInterval: 60000,
  });

  const filtered = logins.filter(l =>
    !search ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.ipAddress.includes(search)
  );

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">
              Login History
            </h1>
            <p className="text-[13px] text-[#64748b] mt-0.5">
              Track who logged in, when, and from where
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fdf4] text-[#16a34a] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Live tracking
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[#94a3b8]">
            search
          </span>
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] text-[#0f172a] placeholder-[#94a3b8] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
            placeholder="Search by name, email, or IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table — desktop (sm+) */}
        <div className="hidden sm:block bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#0f172a]">Recent Logins</h2>
            <span className="text-[12px] text-[#94a3b8]">Last 100 logins</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8f9fa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">IP Address</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Browser</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">OS</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Device</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#94a3b8]">
                    <LogoSpinner message="Loading…" py="py-4" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[#94a3b8]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                      <p className="text-[13px]">{search ? 'No results found' : 'No login history yet'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className="hover:bg-[#fafbff] transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f172a]">{l.userName}</p>
                        <p className="text-[11px] text-[#64748b]">{l.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#374151]">
                        <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">location_on</span>
                        {l.ipAddress || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#374151]">
                        <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">travel_explore</span>
                        {l.browser}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[12px] text-[#374151]">{l.os}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#374151]">
                        <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">{DEVICE_ICON[l.device] ?? 'devices'}</span>
                        {l.device}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-[12px] font-medium text-[#374151]">{timeAgo(l.loggedInAt)}</p>
                        <p className="text-[10px] text-[#94a3b8]">{formatDate(l.loggedInAt)}</p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile only */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Recent Logins</h2>
            <span className="text-[11px] text-[#94a3b8]">Last 100</span>
          </div>

          {isLoading ? (
            <LogoSpinner message="Loading…" py="py-12" />
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] py-14 flex flex-col items-center gap-2 text-[#94a3b8]">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              <p className="text-[13px]">{search ? 'No results found' : 'No login history yet'}</p>
            </div>
          ) : (
            filtered.map(l => (
              <div key={l.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 space-y-3">
                {/* User + time */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0f172a]">{l.userName}</p>
                    <p className="text-[11px] text-[#64748b] mt-0.5">{l.userEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-medium text-[#374151]">{timeAgo(l.loggedInAt)}</p>
                    <p className="text-[10px] text-[#94a3b8] mt-0.5">{formatDate(l.loggedInAt)}</p>
                  </div>
                </div>

                {/* IP */}
                <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#374151]">
                  <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">location_on</span>
                  {l.ipAddress || '—'}
                </div>

                {/* Browser / OS / Device chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[11px] text-[#475569]">
                    <span className="material-symbols-outlined text-[12px]">travel_explore</span>
                    {l.browser}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[11px] text-[#475569]">
                    <span className="material-symbols-outlined text-[12px]">desktop_windows</span>
                    {l.os}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[11px] text-[#475569]">
                    <span className="material-symbols-outlined text-[12px]">{DEVICE_ICON[l.device] ?? 'devices'}</span>
                    {l.device}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
