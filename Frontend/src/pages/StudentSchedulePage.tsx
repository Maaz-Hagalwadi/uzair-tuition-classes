import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

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
  createdByName: string | null;
}

interface Batch {
  id: number;
  name: string;
  courseName: string;
  status: string;
}

const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_L = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  GOOGLE_MEET:     { label: 'Google Meet',    color: '#059669', bg: '#f0fdf4' },
  ZOOM:            { label: 'Zoom',           color: '#2563eb', bg: '#eff6ff' },
  MICROSOFT_TEAMS: { label: 'Teams',          color: '#7c3aed', bg: '#f5f3ff' },
  OTHER:           { label: 'Online',         color: '#64748b', bg: '#f8fafc' },
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function parseDateLabel(dateStr: string) {
  const d     = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.round((d.getTime() - today.getTime()) / 86400000);
  const dayNum  = d.getDate();
  const month   = MONTHS_S[d.getMonth()];
  const dayName = DAYS[d.getDay()];
  const full    = `${dayName}, ${MONTHS_L[d.getMonth()]} ${dayNum}`;
  if (diff === 0) return { heading: 'Today',    sub: full, isToday: true,  isTomorrow: false, dayNum, month };
  if (diff === 1) return { heading: 'Tomorrow', sub: full, isToday: false, isTomorrow: true,  dayNum, month };
  return           { heading: full,             sub: '',   isToday: false, isTomorrow: false, dayNum, month };
}

function groupByDate(sessions: Session[]): [string, Session[]][] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const arr = map.get(s.sessionDate) ?? [];
    arr.push(s);
    map.set(s.sessionDate, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function StudentSchedulePage() {
  const [batchFilter, setBatchFilter] = useState<number | 'ALL'>('ALL');
  const [expanded, setExpanded]       = useState<Set<number>>(new Set());

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['student-batches'],
    queryFn: async () => (await api.get('/student/batches')).data,
  });

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['student-upcoming-sessions'],
    queryFn: async () => (await api.get('/student/sessions/upcoming')).data,
  });

  const filtered = useMemo(() =>
    batchFilter === 'ALL' ? sessions : sessions.filter(s => s.batchId === batchFilter),
    [sessions, batchFilter],
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const todayStr   = new Date().toISOString().slice(0, 10);
  const todayCount = sessions.filter(s => s.sessionDate === todayStr).length;

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">My Schedule</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Your upcoming class sessions</p>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Batch filter */}
          <div className="flex border border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
            {([{ id: 'ALL' as const, name: 'All Batches' }, ...batches] as { id: number | 'ALL'; name: string }[]).map(b => (
              <button
                key={String(b.id)}
                onClick={() => setBatchFilter(b.id as number | 'ALL')}
                className={`px-4 py-2 text-[12px] font-medium border-r last:border-r-0 border-[#e2e8f0] transition-colors ${
                  batchFilter === b.id
                    ? 'bg-[#0d1b3e] text-white'
                    : 'text-[#6b7280] hover:bg-[#f8fafc]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Summary pills */}
          {!isLoading && sessions.length > 0 && (
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef2ff] text-[#4f46e5] text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[11px]">event</span>
                {sessions.length} upcoming
              </span>
              {todayCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fffbeb] text-[#92400e] text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                  {todayCount} today
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[30px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading sessions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#94a3b8]">
            <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">No upcoming sessions</p>
            <p className="text-[12px] text-[#94a3b8] mt-1">
              {batchFilter !== 'ALL' ? 'Try switching to All Batches' : 'Your teacher will schedule sessions here'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([dateStr, daySessions]) => {
              const { heading, sub, isToday, isTomorrow, dayNum, month } = parseDateLabel(dateStr);

              return (
                <div key={dateStr}>

                  {/* ── Date header ── */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 shrink-0">
                      {isToday && <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />}
                      <span className={`text-[13px] font-bold ${
                        isToday ? 'text-[#92400e]' : isTomorrow ? 'text-[#1d4ed8]' : 'text-[#0f172a]'
                      }`}>{heading}</span>
                      {sub && <span className="text-[12px] text-[#94a3b8]">{sub}</span>}
                    </div>
                    <div className="flex-1 h-px bg-[#f1f5f9]" />
                    <span className="text-[11px] text-[#94a3b8] shrink-0">
                      {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* ── Session rows ── */}
                  <div className="space-y-2.5">
                    {daySessions.map(session => {
                      const platform = PLATFORM_META[session.meetingPlatform] ?? PLATFORM_META.OTHER;
                      const isOpen   = expanded.has(session.id);

                      return (
                        <div key={session.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-sm transition-shadow ${
                          isToday ? 'border-[#fde68a]' : 'border-[#e2e8f0]'
                        }`}>

                          {/* Collapsed row */}
                          <div className="flex items-center gap-4 px-5 py-4">

                            {/* Date chip */}
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                              isToday ? 'bg-[#fffbeb]' : 'bg-[#f1f5f9]'
                            }`}>
                              <span className={`text-[8px] font-bold uppercase ${isToday ? 'text-[#d97706]' : 'text-[#6b7280]'}`}>{month}</span>
                              <span className={`text-[15px] font-black leading-none ${isToday ? 'text-[#92400e]' : 'text-[#0f172a]'}`}>{dayNum}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-semibold text-[#0f172a] leading-snug truncate">{session.title}</p>
                              <p className="text-[12px] text-[#64748b] mt-0.5 truncate">
                                {session.batchName} · {session.courseName}
                              </p>
                            </div>

                            {/* Time badge */}
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[#374151] text-[11px] font-semibold shrink-0">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {formatTime(session.startTime)}
                              {session.endTime && ` – ${formatTime(session.endTime)}`}
                            </span>

                            {/* Join button (if URL exists) */}
                            {session.meetingUrl && (
                              <a
                                href={session.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition-all"
                                style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2f5a)' }}
                              >
                                <span className="material-symbols-outlined text-[12px]">videocam</span>
                                Join
                              </a>
                            )}

                            {/* Details toggle */}
                            <button
                              onClick={() => toggleExpand(session.id)}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                                isOpen
                                  ? 'bg-[#f1f5f9] border-[#e2e8f0] text-[#374151]'
                                  : 'bg-white border-[#e2e8f0] text-[#374151] hover:bg-[#f8fafc]'
                              }`}
                            >
                              Details
                              <span className="material-symbols-outlined text-[14px] transition-transform duration-200"
                                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                expand_more
                              </span>
                            </button>
                          </div>

                          {/* Expanded panel */}
                          {isOpen && (
                            <div className="border-t border-[#f1f5f9] px-5 py-4 bg-[#fafbff]">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Time</p>
                                  <p className="text-[12px] font-semibold text-[#374151]">
                                    {formatTime(session.startTime)}
                                    {session.endTime && ` – ${formatTime(session.endTime)}`}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Batch</p>
                                  <p className="text-[12px] font-semibold text-[#374151]">{session.batchName}</p>
                                </div>
                                {session.createdByName && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Teacher</p>
                                    <p className="text-[12px] font-semibold text-[#374151]">{session.createdByName}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Platform</p>
                                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: platform.bg, color: platform.color }}>
                                    <span className="material-symbols-outlined text-[12px]">videocam</span>
                                    {platform.label}
                                  </span>
                                </div>
                                {session.meetingUrl && (
                                  <div className="col-span-2 sm:col-span-4">
                                    <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Meeting Link</p>
                                    <a
                                      href={session.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-all"
                                      style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2f5a)' }}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">videocam</span>
                                      Join Session
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
