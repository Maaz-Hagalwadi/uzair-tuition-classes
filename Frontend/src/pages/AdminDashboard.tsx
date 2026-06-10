import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import { useAuthStore } from '../stores/authStore';
import { apiGet } from '../lib/api';

interface UserRecord { id: number; roles: string[]; active: boolean; }
interface Course { id: number; status: string; }
interface Batch { id: number; status: string; }
interface Lead {
  id: number; fullName: string; email: string;
  interestedCourse: string | null; status: string; createdAt: string;
}
interface LeadCounts { NEW: number; CONTACTED: number; ENROLLED: number; CLOSED: number; }

const STATUS_CFG = {
  NEW:       { label: 'New',       dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  CONTACTED: { label: 'Contacted', dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  ENROLLED:  { label: 'Enrolled',  dot: '#10b981', bg: '#ecfdf5', text: '#065f46' },
  CLOSED:    { label: 'Closed',    dot: '#9ca3af', bg: '#f9fafb', text: '#4b5563' },
} as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface StatCardProps {
  label: string; value: number | string; icon: string;
  color: string; light: string; href: string; sub?: string;
}
function StatCard({ label, value, icon, color, light, href, sub }: StatCardProps) {
  return (
    <Link to={href} className="bg-white rounded-xl border border-[#e2e8f0] p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: light }}>
        <span className="material-symbols-outlined text-[18px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-black text-[#0f172a] leading-none">{value}</p>
        <p className="text-[11px] text-[#64748b] mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] text-[#94a3b8] mt-0.5 truncate">{sub}</p>}
      </div>
    </Link>
  );
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[#64748b]">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#374151]">{value}</span>
          <span className="text-[10px] text-[#94a3b8] w-7 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const user = useAuthStore(s => s.user);

  const { data: users = [] } = useQuery<UserRecord[]>({
    queryKey: ['admin-users-all'],
    queryFn: apiGet('/admin/users'),
  });
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: apiGet('/admin/courses'),
  });
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['admin-batches'],
    queryFn: apiGet('/admin/batches'),
  });
  const { data: leadCounts } = useQuery<LeadCounts>({
    queryKey: ['admin-lead-counts'],
    queryFn: apiGet('/admin/leads/counts'),
  });
  const { data: recentLeads = [] } = useQuery<Lead[]>({
    queryKey: ['admin-leads-recent'],
    queryFn: apiGet('/admin/leads'),
  });

  const studentCount = users.filter(u => u.roles.includes('STUDENT')).length;
  const teacherCount = users.filter(u => u.roles.includes('TEACHER')).length;
  const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;
  const activeBatches = batches.filter(b => b.status === 'ACTIVE' || b.status === 'UPCOMING').length;
  const counts = leadCounts ?? { NEW: 0, CONTACTED: 0, ENROLLED: 0, CLOSED: 0 };
  const totalLeads = counts.NEW + counts.CONTACTED + counts.ENROLLED + counts.CLOSED;
  const top6 = recentLeads.slice(0, 6);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#94a3b8] font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="text-[18px] font-bold text-[#0f172a] mt-0.5">
              {greeting}, <span className="text-[#6366f1]">{user?.firstName}</span>
            </h1>
          </div>
          <Link
            to="/admin/leads"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1e293b] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>contacts</span>
            View Leads
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Students" value={studentCount} icon="school"
            color="#6366f1" light="#eef2ff" href="/admin/users" sub="total enrolled" />
          <StatCard label="Teachers" value={teacherCount} icon="cast_for_education"
            color="#10b981" light="#ecfdf5" href="/admin/users" sub="active educators" />
          <StatCard label="Active Courses" value={activeCourses} icon="menu_book"
            color="#f59e0b" light="#fffbeb" href="/admin/courses" sub={`of ${courses.length} total`} />
          <StatCard label="Active Batches" value={activeBatches} icon="groups"
            color="#3b82f6" light="#eff6ff" href="/admin/batches" sub={`of ${batches.length} total`} />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent leads */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-[13px] font-bold text-[#0f172a]">Recent Leads</h2>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">People who submitted the contact form</p>
              </div>
              <Link to="/admin/leads" className="flex items-center gap-0.5 text-[11px] font-semibold text-[#6366f1] hover:underline">
                All leads
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </Link>
            </div>

            {top6.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#cbd5e1]">
                <span className="material-symbols-outlined text-[36px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>contacts</span>
                <p className="text-[12px] text-[#94a3b8]">No leads yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f8fafc]">
                {top6.map(lead => {
                  const cfg = STATUS_CFG[lead.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.NEW;
                  const letters = lead.fullName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={lead.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafbff] transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#6366f1]">{letters}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#0f172a] truncate">{lead.fullName}</p>
                        <p className="text-[10px] text-[#94a3b8] truncate">{lead.email}</p>
                      </div>
                      <p className="hidden sm:block text-[10px] text-[#94a3b8] shrink-0 max-w-[80px] truncate">
                        {lead.interestedCourse ?? '—'}
                      </p>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cfg.dot }} />
                        {cfg.label}
                      </span>
                      <p className="hidden md:block text-[10px] text-[#cbd5e1] shrink-0 w-10 text-right">
                        {timeAgo(lead.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Lead funnel */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-bold text-[#0f172a]">Lead Funnel</h2>
                <span className="text-[10px] bg-[#f1f5f9] text-[#64748b] font-semibold px-1.5 py-0.5 rounded-full">
                  {totalLeads} total
                </span>
              </div>
              <div className="space-y-2.5">
                <FunnelBar label="New"       value={counts.NEW}       total={totalLeads} color="#f59e0b" />
                <FunnelBar label="Contacted" value={counts.CONTACTED} total={totalLeads} color="#3b82f6" />
                <FunnelBar label="Enrolled"  value={counts.ENROLLED}  total={totalLeads} color="#10b981" />
                <FunnelBar label="Closed"    value={counts.CLOSED}    total={totalLeads} color="#9ca3af" />
              </div>
              {totalLeads > 0 && (
                <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                  <span className="text-[11px] text-[#94a3b8]">Conversion rate</span>
                  <span className="text-[13px] font-bold text-[#10b981]">
                    {Math.round((counts.ENROLLED / totalLeads) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
              <h2 className="text-[13px] font-bold text-[#0f172a] mb-2.5">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Add User',   icon: 'person_add',  href: '/admin/users',    color: '#6366f1', bg: '#eef2ff' },
                  { label: 'New Course', icon: 'add_circle',  href: '/admin/courses',  color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'New Batch',  icon: 'group_add',   href: '/admin/batches',  color: '#10b981', bg: '#ecfdf5' },
                  { label: 'Payments',   icon: 'payments',    href: '/admin/payments', color: '#3b82f6', bg: '#eff6ff' },
                ].map(a => (
                  <Link
                    key={a.label}
                    to={a.href}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: a.bg }}
                  >
                    <span className="material-symbols-outlined text-[18px]"
                      style={{ color: a.color, fontVariationSettings: "'FILL' 1" }}>
                      {a.icon}
                    </span>
                    <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: a.color }}>
                      {a.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
