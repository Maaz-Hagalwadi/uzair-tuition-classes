import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useAuthStore } from '../stores/authStore';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

interface Batch {
  id: number;
  name: string;
  courseName: string;
  status: string;
  studentCount: number;
}

interface Session {
  id: number;
  batchName: string;
  courseName: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string | null;
  meetingUrl: string | null;
  meetingPlatform: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const PLATFORM_META: Record<string, { label: string; bg: string; text: string }> = {
  GOOGLE_MEET:     { label: 'Google Meet', bg: '#ecfdf5', text: '#059669' },
  ZOOM:            { label: 'Zoom',         bg: '#eff6ff', text: '#2563eb' },
  MICROSOFT_TEAMS: { label: 'Teams',        bg: '#eef2ff', text: '#6366f1' },
  OTHER:           { label: 'Other',         bg: '#f9fafb', text: '#6b7280' },
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: async () => { const { data } = await api.get('/teacher/batches'); return data; },
  });

  const { data: upcomingSessions = [] } = useQuery<Session[]>({
    queryKey: ['teacher-upcoming-sessions'],
    queryFn: async () => { const { data } = await api.get('/teacher/sessions/upcoming'); return data; },
  });

  const activeBatches = batches.filter(b => b.status === 'ACTIVE' || b.status === 'UPCOMING').length;
  const totalStudents = batches.reduce((sum, b) => sum + b.studentCount, 0);

  const kpi = [
    { icon: 'groups',      label: 'Active Batches',    value: activeBatches,              bg: '#eef2ff', ic: '#6366f1' },
    { icon: 'people',      label: 'Total Students',    value: totalStudents,              bg: '#f0fdf4', ic: '#10b981' },
    { icon: 'event',       label: 'Upcoming Sessions', value: upcomingSessions.length,    bg: '#fff7ed', ic: '#f59e0b' },
    { icon: 'quiz',        label: 'Quizzes Created',   value: '—',                        bg: '#eff6ff', ic: '#3b82f6' },
  ];

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1e1b4b]">Welcome back, {user?.firstName}</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Here's an overview of your teaching activity.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpi.map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-[#e4e2e6] p-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: k.bg }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: k.ic, fontVariationSettings: "'FILL' 1" }}>
                  {k.icon}
                </span>
              </div>
              <p className="text-[26px] font-bold text-[#1e1b4b] leading-none">{k.value}</p>
              <p className="text-xs text-[#6b7280] mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e4e2e6]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-[#1e1b4b]">Upcoming Sessions</h3>
              <Link to="/teacher/batches" className="text-xs text-[#6366f1] font-medium hover:underline">
                View batches →
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
                <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                <p className="text-sm">No upcoming sessions</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f3f4f6]">
                {upcomingSessions.slice(0, 5).map(session => {
                  const d = new Date(session.sessionDate);
                  const platform = PLATFORM_META[session.meetingPlatform];
                  return (
                    <div key={session.id} className="flex items-start gap-3 px-5 py-3">
                      {/* Date block */}
                      <div className="shrink-0 w-11 flex flex-col items-center bg-[#f3f4f6] rounded-lg py-1.5">
                        <span className="text-[9px] font-semibold text-[#6b7280] uppercase">{MONTHS[d.getMonth()]}</span>
                        <span className="text-base font-bold text-[#1e1b4b] leading-tight">{d.getDate()}</span>
                        <span className="text-[9px] text-[#9ca3af]">{DAYS[d.getDay()]}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-medium text-[#374151] truncate">{session.title}</p>
                        <p className="text-xs text-[#9ca3af]">{session.batchName} · {formatTime(session.startTime)}</p>
                        {session.meetingUrl && (
                          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-[#6366f1] hover:underline">
                            <span className="material-symbols-outlined text-[11px]">link</span>
                            Join
                          </a>
                        )}
                      </div>
                      {platform && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: platform.bg, color: platform.text }}>
                          {platform.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-[#e4e2e6] p-5">
            <h3 className="text-sm font-semibold text-[#1e1b4b] mb-4">Quick Access</h3>
            <div className="space-y-2">
              {[
                { icon: 'groups',       label: 'My Batches',    sub: `${batches.length} batch${batches.length !== 1 ? 'es' : ''}`, href: '/teacher/batches', bg: '#eef2ff', ic: '#6366f1' },
                { icon: 'person_search', label: 'Students',     sub: `${totalStudents} enrolled`, href: '/teacher/students', bg: '#f0fdf4', ic: '#10b981' },
                { icon: 'folder_open',  label: 'Materials',     sub: 'Upload resources', href: '/teacher/materials', bg: '#fff7ed', ic: '#f59e0b' },
                { icon: 'quiz',         label: 'Quizzes',       sub: 'Coming soon', href: '/teacher/quizzes', bg: '#eff6ff', ic: '#3b82f6' },
              ].map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f9fafb] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.bg }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: item.ic, fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#374151] group-hover:text-[#1e1b4b]">{item.label}</p>
                    <p className="text-xs text-[#9ca3af]">{item.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-[#9ca3af] group-hover:text-[#6366f1] transition-colors">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
