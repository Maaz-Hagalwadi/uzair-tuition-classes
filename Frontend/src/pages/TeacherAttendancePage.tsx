import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import { ADMIN_NAV } from '../lib/adminNav';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Session {
  id: number;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string | null;
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  status: string;
  notes: string | null;
}

type Status = 'PRESENT' | 'ABSENT' | 'LATE';

const STATUS_CFG: Record<Status, { label: string; activeClass: string; inactiveClass: string; chipClass: string; dot: string }> = {
  PRESENT: {
    label:        'Present',
    activeClass:  'bg-[#16a34a] text-white shadow-sm',
    inactiveClass:'bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]',
    chipClass:    'bg-[#f0fdf4] text-[#15803d]',
    dot:          'bg-[#22c55e]',
  },
  LATE: {
    label:        'Late',
    activeClass:  'bg-[#d97706] text-white shadow-sm',
    inactiveClass:'bg-[#fffbeb] text-[#d97706] hover:bg-[#fef3c7]',
    chipClass:    'bg-[#fffbeb] text-[#92400e]',
    dot:          'bg-[#f59e0b]',
  },
  ABSENT: {
    label:        'Absent',
    activeClass:  'bg-[#dc2626] text-white shadow-sm',
    inactiveClass:'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]',
    chipClass:    'bg-[#fef2f2] text-[#991b1b]',
    dot:          'bg-[#ef4444]',
  },
};

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function TeacherAttendancePage() {
  const { batchId, sessionId } = useParams<{ batchId: string; sessionId: string }>();
  const navigate = useNavigate();
  const roles    = useAuthStore(s => s.user?.roles ?? []);
  const navItems = roles.includes('ADMIN') ? ADMIN_NAV : TEACHER_NAV;
  const bId      = Number(batchId);
  const sId      = Number(sessionId);

  const [marks, setMarks]   = useState<Record<number, Status>>({});
  const [saved, setSaved]   = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['batch-sessions', bId],
    queryFn: async () => { const { data } = await api.get(`/admin/batches/${bId}/sessions`); return data; },
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['teacher-batch-students', bId],
    queryFn: async () => { const { data } = await api.get(`/teacher/batches/${bId}/students`); return data; },
  });

  const { data: existing = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['session-attendance', sId],
    queryFn: async () => { const { data } = await api.get(`/teacher/sessions/${sId}/attendance`); return data; },
  });

  useEffect(() => {
    if (existing.length > 0) {
      const init: Record<number, Status> = {};
      existing.forEach(r => { init[r.studentId] = r.status as Status; });
      setMarks(prev => ({ ...init, ...prev }));
    } else if (students.length > 0) {
      const init: Record<number, Status> = {};
      students.forEach(s => { init[s.studentId] = 'ABSENT'; });
      setMarks(prev => Object.keys(prev).length === 0 ? init : prev);
    }
  }, [existing, students]);

  const saveMutation = useMutation({
    mutationFn: () => api.post(`/teacher/sessions/${sId}/attendance`, {
      entries: students.map(s => ({
        studentId: s.studentId,
        status:    marks[s.studentId] ?? 'ABSENT',
        notes:     null,
      })),
    }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); setErrMsg(''); },
    onError:   (e: any) => setErrMsg(e.response?.data?.message ?? 'Failed to save attendance.'),
  });

  const session = sessions.find(s => s.id === sId);

  const counts = Object.values(marks).reduce((acc, s) => {
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function markAll(s: Status) {
    const all: Record<number, Status> = {};
    students.forEach(st => { all[st.studentId] = s; });
    setMarks(all);
  }

  const backPath = roles.includes('ADMIN')
    ? `/admin/batches/${bId}`
    : `/teacher/batches/${bId}`;

  return (
    <DashboardShell navItems={navItems}>
      <div className="max-w-6xl mx-auto space-y-4">

        {/* ── Back link ── */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-[12px] text-[#64748b] hover:text-[#0f172a] transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          Back to Batch
        </button>

        {/* ── Session header ── */}
        {session ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4">
            <h1 className="font-['Source_Serif_4'] text-[22px] font-semibold text-[#0f172a] leading-snug">
              {session.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[12px] text-[#64748b]">
                <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                {formatDate(session.sessionDate)}
              </span>
              <span className="inline-flex items-center gap-1 text-[12px] text-[#64748b]">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {formatTime(session.startTime)}
                {session.endTime && ` – ${formatTime(session.endTime)}`}
              </span>
            </div>

            {/* Live count chips */}
            {students.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {(['PRESENT', 'LATE', 'ABSENT'] as Status[]).map(s => {
                  const cfg = STATUS_CFG[s];
                  return (
                    <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.chipClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {counts[s] ?? 0} {cfg.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 text-[#94a3b8] text-[13px]">
            Loading session…
          </div>
        )}

        {/* ── Banners ── */}
        {errMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-[12px] text-[#dc2626]">
            <span className="material-symbols-outlined text-[15px]">error</span>
            {errMsg}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-[12px] text-[#16a34a]">
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Attendance saved successfully.
          </div>
        )}

        {/* ── Student list ── */}
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
            <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px] text-[#cbd5e1]" style={{ fontVariationSettings: "'FILL' 1" }}>people</span>
            </div>
            <p className="text-[14px] font-semibold text-[#374151]">No students enrolled</p>
            <p className="text-[12px] text-[#94a3b8] mt-1">Enrol students in this batch first.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">

              {/* Mark-all row */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-[#f8fafc] border-b border-[#f1f5f9]">
                <p className="text-[11px] font-semibold text-[#64748b]">Mark all as:</p>
                <div className="flex gap-1.5">
                  {(['PRESENT', 'LATE', 'ABSENT'] as Status[]).map(s => (
                    <button
                      key={s}
                      onClick={() => markAll(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${STATUS_CFG[s].inactiveClass}`}
                    >
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student rows */}
              <div className="divide-y divide-[#f8fafc]">
                {students.map((student, i) => {
                  const current = marks[student.studentId] ?? 'ABSENT';
                  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafbff] transition-colors"
                    >
                      {/* Row number */}
                      <span className="text-[11px] text-[#cbd5e1] w-5 shrink-0 text-right">{i + 1}</span>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#6366f1]">{initials}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#0f172a]">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[10px] text-[#94a3b8] truncate">{student.email}</p>
                      </div>

                      {/* Toggle buttons */}
                      <div className="flex gap-1 shrink-0">
                        {(['PRESENT', 'LATE', 'ABSENT'] as Status[]).map(s => (
                          <button
                            key={s}
                            onClick={() => setMarks(prev => ({ ...prev, [student.studentId]: s }))}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              current === s ? STATUS_CFG[s].activeClass : STATUS_CFG[s].inactiveClass
                            }`}
                          >
                            {STATUS_CFG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1a2f5a 100%)' }}
              >
                {saveMutation.isPending && (
                  <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                )}
                {saveMutation.isPending ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
