import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';

interface Announcement { id: number; title: string; content: string; batchName: string | null; publishedByName: string | null; createdAt: string; }
import { useAuthStore } from '../stores/authStore';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface Batch {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  teacherName: string | null;
  startDate: string | null;
  endDate: string | null;
  timings: string | null;
  status: string;
  studentCount: number;
}

interface Session {
  id: number;
  batchId: number;
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

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['student-batches'],
    queryFn: async () => { const { data } = await api.get('/student/batches'); return data; },
  });

  const { data: upcomingSessions = [] } = useQuery<Session[]>({
    queryKey: ['student-upcoming-sessions'],
    queryFn: async () => { const { data } = await api.get('/student/sessions/upcoming'); return data; },
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['student-announcements'],
    queryFn: async () => { const { data } = await api.get('/student/announcements'); return data; },
  });

  const activeBatches = batches.filter(b => b.status === 'ACTIVE' || b.status === 'UPCOMING').length;

  const kpi = [
    { icon: 'menu_book',      label: 'Enrolled Courses',    value: batches.length,           bg: '#eef2ff', ic: '#6366f1' },
    { icon: 'groups',         label: 'Active Batches',      value: activeBatches,            bg: '#f0fdf4', ic: '#10b981' },
    { icon: 'event',          label: 'Upcoming Sessions',   value: upcomingSessions.length,  bg: '#fff7ed', ic: '#f59e0b' },
    { icon: 'quiz',           label: 'Quizzes',             value: '—',                      bg: '#eff6ff', ic: '#3b82f6' },
  ];

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1e1b4b]">Welcome back, {user?.firstName}</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Here's an overview of your learning activity.</p>
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
              <Link to="/student/schedule" className="text-xs text-[#6366f1] font-medium hover:underline">
                View all →
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

          {/* Announcements */}
          <div className="bg-white rounded-xl border border-[#e4e2e6]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
              <h3 className="text-sm font-semibold text-[#1e1b4b]">Announcements</h3>
              <Link to="/student/announcements" className="text-xs text-[#6366f1] font-medium hover:underline">
                View all →
              </Link>
            </div>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#9ca3af]">
                <span className="material-symbols-outlined text-[28px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                <p className="text-xs">No announcements yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f3f4f6]">
                {announcements.slice(0, 4).map(a => (
                  <div key={a.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-[#374151] truncate">{a.title}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5 truncate">
                      {a.publishedByName}{a.batchName && ` · ${a.batchName}`}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
