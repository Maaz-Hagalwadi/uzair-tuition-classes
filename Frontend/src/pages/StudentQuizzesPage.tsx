import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface QuizSummary {
  id: number;
  title: string;
  description: string | null;
  batchId: number;
  batchName: string;
  timeLimitMinutes: number | null;
  status: string;
  questionCount: number;
  createdAt: string;
}

interface Attempt {
  id: number;
  quizId: number;
  quizTitle: string;
  score: number | null;
  totalMarks: number | null;
  status: string;
  submittedAt: string | null;
}

export default function StudentQuizzesPage() {
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<QuizSummary[]>({
    queryKey: ['student-quizzes'],
    queryFn: async () => { const { data } = await api.get('/student/quizzes'); return data; },
  });

  const { data: attempts = [] } = useQuery<Attempt[]>({
    queryKey: ['student-attempts'],
    queryFn: async () => { const { data } = await api.get('/student/attempts'); return data; },
  });

  const attemptMap = useMemo(() =>
    new Map(attempts.map(a => [a.quizId, a])),
    [attempts]
  );

  // Group quizzes by batch
  const byBatch = useMemo(() => {
    const map = new Map<number, { batchName: string; quizzes: QuizSummary[] }>();
    for (const q of quizzes) {
      if (!map.has(q.batchId)) map.set(q.batchId, { batchName: q.batchName, quizzes: [] });
      map.get(q.batchId)!.quizzes.push(q);
    }
    return Array.from(map.values());
  }, [quizzes]);

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Quizzes</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
            {quizzes.length > 0
              ? `${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} available`
              : 'Quizzes from your teachers will appear here'}
          </p>
        </div>

        {quizzesLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading…</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <p className="text-[13px] font-medium">No quizzes available yet</p>
            <p className="text-[11px] mt-1">Your teachers will publish quizzes here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {byBatch.map(({ batchName, quizzes: batchQuizzes }) => (
              <div key={batchName}>
                <h2 className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">{batchName}</h2>
                <div className="space-y-3">
                  {batchQuizzes.map(quiz => {
                    const attempt = attemptMap.get(quiz.id);
                    const attempted = !!attempt && attempt.status === 'SUBMITTED';
                    const pct = attempted && attempt.totalMarks
                      ? Math.round((attempt.score! / attempt.totalMarks) * 100) : null;

                    return (
                      <div key={quiz.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          attempted ? 'bg-[#f0fdf4]' : 'bg-[#eef2ff]'
                        }`}>
                          <span className={`material-symbols-outlined text-[17px] sm:text-[18px] ${
                            attempted ? 'text-[#16a34a]' : 'text-[#6366f1]'
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {attempted ? 'task_alt' : 'quiz'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] sm:text-[13px] font-semibold text-[#0f172a]">{quiz.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-[#94a3b8]">
                            <span>{quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}</span>
                            {quiz.timeLimitMinutes && <span>{quiz.timeLimitMinutes} min</span>}
                            {attempted && pct !== null && (
                              <span className={`font-semibold ${pct >= 70 ? 'text-[#16a34a]' : pct >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                                {attempt!.score}/{attempt!.totalMarks} ({pct}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {attempted ? (
                          <Link to={`/student/quizzes/${quiz.id}`}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#f1f5f9] text-[#6b7280] rounded-xl text-[11px] font-medium hover:bg-[#e2e8f0]">
                            <span className="material-symbols-outlined text-[13px]">visibility</span>Results
                          </Link>
                        ) : (
                          <Link to={`/student/quizzes/${quiz.id}`}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#0f172a] text-white rounded-xl text-[11px] font-medium hover:opacity-90">
                            <span className="material-symbols-outlined text-[13px]">play_arrow</span>Start
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
