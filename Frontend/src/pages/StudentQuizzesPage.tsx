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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1e1b4b]">Quizzes</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {quizzes.length > 0
              ? `${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} available`
              : 'Quizzes from your teachers will appear here'}
          </p>
        </div>

        {quizzesLoading ? (
          <div className="flex items-center justify-center py-20 text-[#6b7280]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
            <span className="material-symbols-outlined text-[48px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <p className="text-sm font-medium">No quizzes available yet</p>
            <p className="text-xs mt-1">Your teachers will publish quizzes here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {byBatch.map(({ batchName, quizzes: batchQuizzes }) => (
              <div key={batchName}>
                <h2 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">{batchName}</h2>
                <div className="space-y-3">
                  {batchQuizzes.map(quiz => {
                    const attempt = attemptMap.get(quiz.id);
                    const attempted = !!attempt && attempt.status === 'SUBMITTED';
                    const pct = attempted && attempt.totalMarks
                      ? Math.round((attempt.score! / attempt.totalMarks) * 100) : null;

                    return (
                      <div key={quiz.id} className="bg-white rounded-xl border border-[#e4e2e6] p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          attempted ? 'bg-[#f0fdf4]' : 'bg-[#eef2ff]'
                        }`}>
                          <span className={`material-symbols-outlined text-[18px] ${
                            attempted ? 'text-[#16a34a]' : 'text-[#6366f1]'
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {attempted ? 'task_alt' : 'quiz'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#374151] text-sm">{quiz.title}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-[#9ca3af]">
                            <span>{quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}</span>
                            {quiz.timeLimitMinutes && <span>{quiz.timeLimitMinutes} min</span>}
                            {attempted && pct !== null && (
                              <span className={`font-semibold ${pct >= 70 ? 'text-[#16a34a]' : pct >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                                Score: {attempt!.score}/{attempt!.totalMarks} ({pct}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {attempted ? (
                          <Link to={`/student/quizzes/${quiz.id}`}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#f3f4f6] text-[#6b7280] rounded-lg text-xs font-medium hover:bg-[#e5e7eb]">
                            <span className="material-symbols-outlined text-[13px]">visibility</span>Results
                          </Link>
                        ) : (
                          <Link to={`/student/quizzes/${quiz.id}`}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#1e1b4b] text-white rounded-lg text-xs font-medium hover:opacity-90">
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
