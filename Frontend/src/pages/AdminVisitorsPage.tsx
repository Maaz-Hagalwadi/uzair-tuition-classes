import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

interface Visit {
  id: number;
  ipAddress: string;
  browser: string;
  os: string;
  device: string;
  page: string;
  referrer: string | null;
  visitedAt: string;
}

interface Stats {
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
  uniqueThisWeek: number;
}

const DEVICE_ICON: Record<string, string> = {
  Mobile: 'smartphone',
  Tablet: 'tablet',
  Desktop: 'computer',
};

const BROWSER_ICON: Record<string, string> = {
  Chrome: 'travel_explore',
  Firefox: 'travel_explore',
  Safari: 'travel_explore',
  Edge: 'travel_explore',
  Opera: 'travel_explore',
  Other: 'public',
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function AdminVisitorsPage() {
  const { data: stats, isLoading: sl } = useQuery<Stats>({
    queryKey: ['visitors-stats'],
    queryFn: async () => (await api.get('/admin/visitors/stats')).data,
    refetchInterval: 60000,
  });

  const { data: visits = [], isLoading: vl } = useQuery<Visit[]>({
    queryKey: ['visitors'],
    queryFn: async () => (await api.get('/admin/visitors')).data,
    refetchInterval: 60000,
  });

  const statCards = [
    { label: 'Total Visits',      value: stats?.totalVisits    ?? 0, icon: 'visibility',     bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Unique Visitors',   value: stats?.uniqueVisitors ?? 0, icon: 'people',          bg: '#f0fdf4', color: '#15803d' },
    { label: 'Visits Today',      value: stats?.visitsToday    ?? 0, icon: 'today',           bg: '#fffbeb', color: '#d97706' },
    { label: 'Unique This Week',  value: stats?.uniqueThisWeek ?? 0, icon: 'date_range',      bg: '#f5f3ff', color: '#7c3aed' },
  ];

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">Website Visitors</h1>
            <p className="text-[13px] text-[#64748b] mt-0.5">Track who is visiting your landing page</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fdf4] text-[#16a34a] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Live tracking
          </span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.bg }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: c.color, fontVariationSettings: "'FILL' 1" }}>
                    {c.icon}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">{c.label}</p>
              </div>
              <p className="text-[28px] font-black text-[#0f172a] leading-none">
                {sl ? '—' : c.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Visitor table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#0f172a]">Recent Visitors</h2>
            <span className="text-[12px] text-[#94a3b8]">Last 50 visits</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8f9fa]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">IP Address</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden sm:table-cell">Browser</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">OS</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Device</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Referrer</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {vl ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#94a3b8]">
                    <span className="material-symbols-outlined text-[24px] animate-spin block mx-auto mb-2">sync</span>
                    Loading…
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[#94a3b8]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>visibility_off</span>
                      <p className="text-[13px]">No visits recorded yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visits.map(v => (
                  <tr key={v.id} className="hover:bg-[#fafbff] transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#374151]">
                        <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">location_on</span>
                        {v.ipAddress ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#374151]">
                        <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">{BROWSER_ICON[v.browser] ?? 'public'}</span>
                        {v.browser ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[12px] text-[#374151]">{v.os ?? '—'}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#374151]">
                        <span className="material-symbols-outlined text-[13px] text-[#94a3b8]">{DEVICE_ICON[v.device] ?? 'devices'}</span>
                        {v.device ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-[12px] text-[#94a3b8] max-w-[160px] truncate">
                      {v.referrer || <span className="italic">Direct</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-[12px] font-medium text-[#374151]">{timeAgo(v.visitedAt)}</p>
                        <p className="text-[10px] text-[#94a3b8]">{formatDate(v.visitedAt)}</p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
