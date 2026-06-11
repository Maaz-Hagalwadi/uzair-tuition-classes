import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import { apiGet } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface BatchProgress {
  batchId: number;
  batchName: string;
  attendancePct: number;
  quizzesTaken: number;
  avgScore: number;
  assignmentsTotal: number;
  assignmentsSubmitted: number;
}

interface ProgressResponse {
  overallAttendancePct: number;
  totalSessionsAttended: number;
  totalSessions: number;
  avgQuizScorePct: number;
  totalQuizzesTaken: number;
  pendingPaymentAmount: number;
  paidPaymentAmount: number;
  totalAssignments: number;
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  avgAssignmentMarksPct: number;
  batches: BatchProgress[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const BATCH_GRADIENTS = [
  'linear-gradient(135deg,#4f46e5,#6366f1)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
  'linear-gradient(135deg,#7c3aed,#8b5cf6)',
  'linear-gradient(135deg,#059669,#10b981)',
  'linear-gradient(135deg,#b45309,#d97706)',
  'linear-gradient(135deg,#db2777,#ec4899)',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pctColors(pct: number) {
  if (pct >= 75) return { text: '#15803d', bg: '#f0fdf4', bar: '#22c55e' };
  if (pct >= 50) return { text: '#92400e', bg: '#fffbeb', bar: '#f59e0b' };
  return              { text: '#991b1b', bg: '#fef2f2', bar: '#ef4444' };
}

function fmtPKR(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n);
}

function batchInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}

function StatCard({ icon, label, value, sub, iconColor, iconBg, valueColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        <p className="text-[11px] text-[#94a3b8] font-medium">{label}</p>
      </div>
      <p
        className="text-[22px] font-bold leading-tight"
        style={{ color: valueColor ?? '#0f172a' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#64748b]">{sub}</p>}
    </div>
  );
}

interface ProgressBarProps {
  pct: number;
  barColor: string;
}

function ProgressBar({ pct, barColor }: ProgressBarProps) {
  return (
    <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentProgressPage() {
  const { data, isLoading } = useQuery<ProgressResponse>({
    queryKey: ['student-progress'],
    queryFn: apiGet('/student/progress'),
  });

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">
            My Progress
          </h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
            A summary of your attendance, quizzes, assignments, and payments
          </p>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[28px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading your progress…</p>
          </div>
        )}

        {/* ── Data ── */}
        {!isLoading && data && (
          <>
            {/* ── 4 summary stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Overall attendance */}
              <StatCard
                icon="fact_check"
                label="Overall Attendance"
                value={`${data.overallAttendancePct}%`}
                sub={`${data.totalSessionsAttended} / ${data.totalSessions} sessions`}
                iconColor={pctColors(data.overallAttendancePct).text}
                iconBg={pctColors(data.overallAttendancePct).bg}
                valueColor={pctColors(data.overallAttendancePct).text}
              />

              {/* Quiz average */}
              <StatCard
                icon="quiz"
                label="Quiz Average"
                value={`${data.avgQuizScorePct}%`}
                sub={`${data.totalQuizzesTaken} quiz${data.totalQuizzesTaken !== 1 ? 'zes' : ''} taken`}
                iconColor={pctColors(data.avgQuizScorePct).text}
                iconBg={pctColors(data.avgQuizScorePct).bg}
                valueColor={pctColors(data.avgQuizScorePct).text}
              />

              {/* Outstanding fees */}
              <StatCard
                icon="payments"
                label="Outstanding Fees"
                value={fmtPKR(data.pendingPaymentAmount)}
                sub={data.pendingPaymentAmount > 0 ? 'Payment due' : 'No dues'}
                iconColor={data.pendingPaymentAmount > 0 ? '#c2410c' : '#16a34a'}
                iconBg={data.pendingPaymentAmount > 0 ? '#fff7ed' : '#f0fdf4'}
                valueColor={data.pendingPaymentAmount > 0 ? '#c2410c' : '#16a34a'}
              />

              {/* Assignments */}
              <StatCard
                icon="assignment_turned_in"
                label="Assignments"
                value={`${data.assignmentsSubmitted} / ${data.totalAssignments}`}
                sub={`${data.assignmentsGraded} graded`}
                iconColor="#4f46e5"
                iconBg="#eef2ff"
              />
            </div>

            {/* ── Per-batch breakdown ── */}
            {data.batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
                <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-outlined text-[30px] text-[#cbd5e1]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    school
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-[#374151]">Not enrolled in any batch yet</p>
                <p className="text-[12px] text-[#94a3b8] mt-1">Enrol in a batch to start tracking your progress.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="font-['Source_Serif_4'] text-[16px] sm:text-[20px] font-semibold text-[#0f172a]">
                  Batch Breakdown
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.batches.map((batch, idx) => {
                    const gradient = BATCH_GRADIENTS[idx % BATCH_GRADIENTS.length];
                    const initials = batchInitials(batch.batchName);
                    const attColors = pctColors(batch.attendancePct);
                    const quizColors = pctColors(batch.avgScore);

                    return (
                      <div
                        key={batch.batchId}
                        className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm space-y-4"
                      >
                        {/* Batch header */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: gradient }}
                          >
                            <span className="text-white text-[11px] font-black">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#0f172a] truncate">{batch.batchName}</p>
                            <p className="text-[11px] text-[#64748b]">
                              {batch.quizzesTaken} quiz{batch.quizzesTaken !== 1 ? 'zes' : ''} · {batch.assignmentsSubmitted}/{batch.assignmentsTotal} assignments
                            </p>
                          </div>
                        </div>

                        {/* Attendance progress */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-[#64748b] font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]" style={{ color: attColors.text }}>
                                fact_check
                              </span>
                              Attendance
                            </span>
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: attColors.bg, color: attColors.text }}
                            >
                              {batch.attendancePct}%
                            </span>
                          </div>
                          <ProgressBar pct={batch.attendancePct} barColor={attColors.bar} />
                        </div>

                        {/* Quiz score progress */}
                        {batch.quizzesTaken > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-[#64748b] font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]" style={{ color: quizColors.text }}>
                                  quiz
                                </span>
                                Quiz avg ({batch.quizzesTaken} taken)
                              </span>
                              <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: quizColors.bg, color: quizColors.text }}
                              >
                                {batch.avgScore}%
                              </span>
                            </div>
                            <ProgressBar pct={batch.avgScore} barColor={quizColors.bar} />
                          </div>
                        )}

                        {/* Assignments stat row */}
                        <div className="flex items-center gap-3 pt-1 border-t border-[#f1f5f9]">
                          <span className="material-symbols-outlined text-[14px] text-[#6366f1]">
                            assignment_turned_in
                          </span>
                          <span className="text-[12px] text-[#374151]">
                            <span className="font-semibold">{batch.assignmentsSubmitted}</span>
                            <span className="text-[#94a3b8]"> / {batch.assignmentsTotal} assignments submitted</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Empty / no-data ── */}
        {!isLoading && !data && (
          <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]">
            <span
              className="material-symbols-outlined text-[40px] mb-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bar_chart
            </span>
            <p className="text-[14px] font-medium text-[#374151]">No progress data available</p>
            <p className="text-[12px] mt-1">Check back after your classes begin.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
