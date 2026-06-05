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

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_S   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS       = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  GOOGLE_MEET:     { label: 'Google Meet',    color: '#059669' },
  ZOOM:            { label: 'Zoom',            color: '#2563eb' },
  MICROSOFT_TEAMS: { label: 'Microsoft Teams', color: '#7c3aed' },
  OTHER:           { label: 'Online',          color: '#64748b' },
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function parseDateLabel(dateStr: string): { heading: string; subheading: string; isToday: boolean; isTomorrow: boolean; dayNum: number; month: string } {
  const d     = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);

  const dayNum  = d.getDate();
  const month   = MONTHS_S[d.getMonth()];
  const dayName = DAYS[d.getDay()];
  const year    = d.getFullYear();
  const thisYear = today.getFullYear();

  const dateLine = `${dayName}, ${MONTHS[d.getMonth()]} ${dayNum}${year !== thisYear ? `, ${year}` : ''}`;

  if (diff === 0) return { heading: 'Today',    subheading: dateLine, isToday: true,  isTomorrow: false, dayNum, month };
  if (diff === 1) return { heading: 'Tomorrow', subheading: dateLine, isToday: false, isTomorrow: true,  dayNum, month };
  return           { heading: dateLine,          subheading: '',       isToday: false, isTomorrow: false, dayNum, month };
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

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['student-batches'],
    queryFn: async () => { const { data } = await api.get('/student/batches'); return data; },
  });

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['student-upcoming-sessions'],
    queryFn: async () => { const { data } = await api.get('/student/sessions/upcoming'); return data; },
  });

  const filtered = useMemo(() =>
    batchFilter === 'ALL' ? sessions : sessions.filter(s => s.batchId === batchFilter),
    [sessions, batchFilter],
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const todayStr    = new Date().toISOString().slice(0, 10);
  const todayCount  = sessions.filter(s => s.sessionDate === todayStr).length;

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Header ── */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">
            My Schedule
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-[13px] text-[#64748b]">Your upcoming class sessions</p>
            {!isLoading && sessions.length > 0 && (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef2ff] text-[#4f46e5]">
                  <span className="material-symbols-outlined text-[12px]">event</span>
                  {sessions.length} upcoming
                </span>
                {todayCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fffbeb] text-[#92400e]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                    {todayCount} today
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Batch filter ── */}
        {batches.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {([{ id: 'ALL' as const, name: 'All Batches' }, ...batches] as { id: number | 'ALL'; name: string }[]).map(b => (
              <button
                key={b.id}
                onClick={() => setBatchFilter(b.id as number | 'ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                  batchFilter === b.id
                    ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-sm'
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#94a3b8] hover:text-[#374151]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[32px] animate-spin mb-3">sync</span>
            <p className="text-[13px]">Loading sessions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <div className="w-16 h-16 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[30px] text-[#cbd5e1]" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            </div>
            <p className="text-[15px] font-semibold text-[#374151]">No upcoming sessions</p>
            <p className="text-[12px] text-[#94a3b8] mt-1.5 text-center max-w-[240px]">
              {batchFilter !== 'ALL' ? 'Try switching to All Batches to see all your sessions.' : 'Your teacher will add sessions here once they\'re scheduled.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([dateStr, daySessions]) => {
              const { heading, subheading, isToday, isTomorrow } = parseDateLabel(dateStr);

              return (
                <div key={dateStr}>

                  {/* ── Date section header ── */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse shrink-0" />
                      )}
                      <div>
                        <span className={`text-[14px] font-bold ${isToday ? 'text-[#92400e]' : isTomorrow ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>
                          {heading}
                        </span>
                        {subheading && (
                          <span className="ml-2 text-[12px] text-[#94a3b8]">{subheading}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-[#f1f5f9]" />
                    <span className="text-[11px] text-[#94a3b8] shrink-0">
                      {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* ── Session rows ── */}
                  <div className="space-y-2">
                    {daySessions.map(session => {
                      const platform = PLATFORM_META[session.meetingPlatform] ?? PLATFORM_META.OTHER;
                      return (
                        <div key={session.id} className="flex items-start gap-3">

                          {/* Time column */}
                          <div className="w-[68px] shrink-0 text-right pt-3">
                            <p className="text-[12px] font-bold text-[#0f172a]">{formatTime(session.startTime)}</p>
                            {session.endTime && (
                              <p className="text-[10px] text-[#94a3b8] mt-0.5">{formatTime(session.endTime)}</p>
                            )}
                          </div>

                          {/* Dot */}
                          <div className="flex flex-col items-center pt-3.5 shrink-0">
                            <div className={`w-2 h-2 rounded-full ring-2 ring-white ring-offset-1 ${
                              isToday ? 'bg-[#f59e0b]' : 'bg-[#6366f1]'
                            }`} />
                          </div>

                          {/* Card */}
                          <div className="flex-1 min-w-0">
                            <div className={`rounded-xl border px-4 py-3 hover:shadow-md transition-all group ${
                              isToday
                                ? 'bg-[#fffdf5] border-[#fde68a] hover:border-[#fbbf24]'
                                : 'bg-white border-[#e2e8f0] hover:border-[#c7d2fe]'
                            }`}>
                              <div className="flex items-start justify-between gap-3">

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-bold text-[#0f172a] leading-snug">{session.title}</p>

                                  <div className="flex flex-wrap items-center gap-x-1 mt-0.5">
                                    <span className="text-[11px] font-medium text-[#6366f1]">{session.batchName}</span>
                                    <span className="text-[#e2e8f0]">·</span>
                                    <span className="text-[11px] text-[#64748b]">{session.courseName}</span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                    {session.createdByName && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8]">
                                        <span className="material-symbols-outlined text-[12px]">person</span>
                                        {session.createdByName}
                                      </span>
                                    )}
                                    <span
                                      className="inline-flex items-center gap-1 text-[11px] font-medium"
                                      style={{ color: platform.color }}
                                    >
                                      <span className="material-symbols-outlined text-[12px]">videocam</span>
                                      {platform.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Join */}
                                {session.meetingUrl ? (
                                  <a
                                    href={session.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white shrink-0 hover:opacity-90 active:scale-95 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2f5a 100%)' }}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">videocam</span>
                                    Join
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#cbd5e1] shrink-0 pt-1">
                                    <span className="material-symbols-outlined text-[13px]">link_off</span>
                                    No link yet
                                  </span>
                                )}

                              </div>
                            </div>
                          </div>

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
