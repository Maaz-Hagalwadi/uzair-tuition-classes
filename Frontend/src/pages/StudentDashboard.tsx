import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { useAuthStore } from '../stores/authStore';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface Batch {
  id: number; name: string; courseId: number; courseName: string;
  teacherName: string | null; startDate: string | null; endDate: string | null;
  timings: string | null; status: string; studentCount: number;
}
interface Session {
  id: number; batchId: number; batchName: string; courseName: string;
  title: string; sessionDate: string; startTime: string; endTime: string | null;
  meetingUrl: string | null; meetingPlatform: string;
}
interface Announcement {
  id: number; title: string; content: string;
  batchName: string | null; publishedByName: string | null; createdAt: string;
}
interface AttendanceSummary {
  batchId: number; batchName: string; totalSessions: number;
  present: number; late: number; absent: number; percentage: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

export default function StudentDashboard() {
  const user = useAuthStore(s => s.user);

  const { data: batches = [] }          = useQuery<Batch[]>({ queryKey: ['student-batches'],            queryFn: async () => (await api.get('/student/batches')).data });
  const { data: sessions = [] }         = useQuery<Session[]>({ queryKey: ['student-upcoming-sessions'], queryFn: async () => (await api.get('/student/sessions/upcoming')).data });
  const { data: announcements = [] }    = useQuery<Announcement[]>({ queryKey: ['student-announcements'], queryFn: async () => (await api.get('/student/announcements')).data });
  const { data: attendance = [] }       = useQuery<AttendanceSummary[]>({ queryKey: ['student-attendance-summary'], queryFn: async () => (await api.get('/student/attendance/summary')).data });

  const activeBatches  = batches.filter(b => b.status === 'ACTIVE').length;
  const overallPct     = attendance.length
    ? Math.round(attendance.reduce((a, s) => a + s.percentage, 0) / attendance.length)
    : null;

  const stats = [
    { label: 'Enrolled Courses',  value: batches.length,          sub: `${activeBatches} active`,                    icon: 'menu_book',     color: '#6366f1', bg: '#eef2ff' },
    { label: 'Upcoming Sessions', value: sessions.length,         sub: sessions.length > 0 ? 'this week' : 'none scheduled', icon: 'event', color: '#0891b2', bg: '#ecfeff' },
    { label: 'Announcements',     value: announcements.length,    sub: 'from teachers',                               icon: 'campaign',      color: '#d97706', bg: '#fffbeb' },
    { label: 'Attendance',        value: overallPct !== null ? `${overallPct}%` : '—', sub: 'overall average',        icon: 'fact_check',    color: overallPct !== null && overallPct < 75 ? '#dc2626' : '#16a34a', bg: overallPct !== null && overallPct < 75 ? '#fef2f2' : '#f0fdf4' },
  ];

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-1">Here's an overview of your learning activity.</p>
          </div>
          <Link
            to="/student/browse"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1a2f5a 100%)' }}
          >
            <span className="material-symbols-outlined text-[14px]">search</span>
            Browse Courses
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{s.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
              </div>
              <p className="text-[24px] sm:text-[30px] font-black text-[#0f172a] leading-none">{s.value}</p>
              <p className="text-[11px] text-[#9ca3af] mt-1.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Upcoming Sessions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9]">
              <h3 className="text-[13px] font-bold text-[#0f172a]">Upcoming Sessions</h3>
              <Link to="/student/schedule" className="text-[12px] text-[#6366f1] font-semibold hover:underline">View all →</Link>
            </div>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
                <span className="material-symbols-outlined text-[32px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                <p className="text-[13px]">No upcoming sessions</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f8fafc]">
                {sessions.slice(0, 5).map(s => {
                  const d = new Date(s.sessionDate + 'T00:00:00');
                  return (
                    <div key={s.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#fafbff] transition-colors">
                      {/* Date chip */}
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#f1f5f9] flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-[#6b7280] uppercase">{MONTHS[d.getMonth()]}</span>
                        <span className="text-[15px] font-black text-[#0f172a] leading-none">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#0f172a] truncate">{s.title}</p>
                        <p className="text-[11px] text-[#9ca3af]">{s.batchName} · {formatTime(s.startTime)}</p>
                      </div>
                      {s.meetingUrl && (
                        <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2f5a)' }}>
                          <span className="material-symbols-outlined text-[11px]">videocam</span>
                          Join
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9]">
              <h3 className="text-[13px] font-bold text-[#0f172a]">Announcements</h3>
              <Link to="/student/announcements" className="text-[12px] text-[#6366f1] font-semibold hover:underline">View all →</Link>
            </div>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#9ca3af]">
                <span className="material-symbols-outlined text-[28px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                <p className="text-[12px]">No announcements yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f8fafc]">
                {announcements.slice(0, 5).map(a => (
                  <div key={a.id} className="px-5 py-3 hover:bg-[#fafbff] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold text-[#0f172a] truncate flex-1">{a.title}</p>
                      <span className="text-[10px] text-[#9ca3af] shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">{a.publishedByName}{a.batchName && ` · ${a.batchName}`}</p>
                    <p className="text-[11px] text-[#6b7280] mt-1 line-clamp-2">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Enrolled Batches quick row ── */}
        {batches.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9]">
              <h3 className="text-[13px] font-bold text-[#0f172a]">My Courses</h3>
              <Link to="/student/courses" className="text-[12px] text-[#6366f1] font-semibold hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {batches.slice(0, 4).map(b => {
                const isActive = b.status === 'ACTIVE';
                return (
                  <div key={b.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#fafbff] transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
                      <span className="text-white text-[9px] font-black">
                        {b.courseName.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#0f172a] truncate">{b.courseName}</p>
                      <p className="text-[11px] text-[#9ca3af]">{b.name}{b.teacherName && ` · ${b.teacherName}`}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold shrink-0"
                      style={{ color: isActive ? '#16a34a' : b.status === 'UPCOMING' ? '#2563eb' : '#9ca3af' }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isActive ? '#22c55e' : b.status === 'UPCOMING' ? '#60a5fa' : '#d1d5db' }} />
                      {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
