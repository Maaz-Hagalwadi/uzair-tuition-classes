import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

interface QuizOption { id: number; optionText: string; isCorrect: boolean | null; orderIndex: number; }
interface QuizQuestion { id: number; questionText: string; questionType: string; marks: number; orderIndex: number; options: QuizOption[]; }
interface QuizSummary {
  id: number; title: string; description: string | null; batchName: string;
  timeLimitMinutes: number | null; status: string; questionCount: number;
}
interface QuizDetail { summary: QuizSummary; questions: QuizQuestion[]; }

interface Attempt {
  id: number; quizId: number; quizTitle: string;
  score: number | null; totalMarks: number | null; status: string; submittedAt: string | null;
}

export default function StudentQuizPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const quizId = Number(id);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);

  const { data: detail, isLoading } = useQuery<QuizDetail>({
    queryKey: ['student-quiz-detail', quizId],
    queryFn: async () => { const { data } = await api.get(`/student/quizzes/${quizId}`); return data; },
  });

  const { data: attempts = [] } = useQuery<Attempt[]>({
    queryKey: ['student-attempts'],
    queryFn: async () => { const { data } = await api.get('/student/attempts'); return data; },
  });

  const existingAttempt = useMemo(() =>
    attempts.find(a => a.quizId === quizId && a.status === 'SUBMITTED'),
    [attempts, quizId]
  );

  const submitMutation = useMutation({
    mutationFn: (answerList: { questionId: number; selectedOptionId: number }[]) =>
      api.post<Attempt>(`/student/quizzes/${quizId}/submit`, { answers: answerList }),
    onSuccess: ({ data }) => {
      setResult(data);
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['student-attempts'] });
    },
  });

  function handleSelect(questionId: number, optionId: number) {
    if (submitted || existingAttempt) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit() {
    if (!detail) return;
    const answerList = detail.questions.map(q => ({
      questionId: q.id,
      selectedOptionId: answers[q.id] ?? 0,
    })).filter(a => a.selectedOptionId !== 0);
    submitMutation.mutate(answerList);
  }

  const answeredCount = Object.keys(answers).length;
  const totalQ = detail?.questions.length ?? 0;
  const canSubmit = !submitted && !existingAttempt && answeredCount > 0 && !submitMutation.isPending;

  // Show result card
  const displayAttempt = result ?? existingAttempt;
  const showResult = submitted || !!existingAttempt;
  const pct = displayAttempt?.totalMarks
    ? Math.round((displayAttempt.score! / displayAttempt.totalMarks) * 100) : null;

  if (isLoading || !detail) {
    return (
      <DashboardShell navItems={STUDENT_NAV}>
        <div className="flex items-center justify-center py-32 text-[#6b7280]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
        </div>
      </DashboardShell>
    );
  }

  const { summary, questions } = detail;

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-4">
          <Link to="/student/quizzes" className="hover:text-[#6366f1]">Quizzes</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#374151]">{summary.title}</span>
        </div>

        {/* Quiz header */}
        <div className="bg-white rounded-xl border border-[#e4e2e6] p-5 mb-5">
          <h1 className="text-lg font-bold text-[#1e1b4b]">{summary.title}</h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">{summary.batchName}</p>
          {summary.description && <p className="text-sm text-[#6b7280] mt-1">{summary.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-[#9ca3af]">
            <span>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            {summary.timeLimitMinutes && <span>{summary.timeLimitMinutes} min limit</span>}
            {!showResult && <span className="text-[#6366f1] font-medium">{answeredCount}/{totalQ} answered</span>}
          </div>
        </div>

        {/* Result banner */}
        {showResult && displayAttempt && pct !== null && (
          <div className={`rounded-xl border p-5 mb-5 ${
            pct >= 70 ? 'bg-[#f0fdf4] border-[#86efac]' : pct >= 40 ? 'bg-[#fffbeb] border-[#fcd34d]' : 'bg-[#fef2f2] border-[#fca5a5]'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold ${
                pct >= 70 ? 'bg-[#16a34a]' : pct >= 40 ? 'bg-[#d97706]' : 'bg-[#dc2626]'
              }`}>
                <span className="text-lg leading-tight">{pct}%</span>
              </div>
              <div>
                <p className="font-bold text-[#1e1b4b]">
                  {pct >= 70 ? 'Great job!' : pct >= 40 ? 'Keep practising!' : 'Better luck next time'}
                </p>
                <p className="text-sm text-[#6b7280]">
                  You scored {displayAttempt.score} out of {displayAttempt.totalMarks} marks
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-xl border border-[#e4e2e6] p-5">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-bold text-[#9ca3af] shrink-0 mt-0.5">Q{qi + 1}</span>
                <p className="text-sm font-medium text-[#374151]">{q.questionText}</p>
              </div>
              <div className="space-y-2 pl-5">
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt.id;
                  const isRevealed = showResult && opt.isCorrect !== null;
                  const isCorrectRevealed = isRevealed && opt.isCorrect;
                  const isWrongSelected = isRevealed && selected && !opt.isCorrect;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(q.id, opt.id)}
                      disabled={showResult}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-colors ${
                        isCorrectRevealed
                          ? 'bg-[#f0fdf4] border border-[#86efac] text-[#16a34a] font-medium'
                          : isWrongSelected
                          ? 'bg-[#fef2f2] border border-[#fca5a5] text-[#dc2626]'
                          : selected
                          ? 'bg-[#eef2ff] border border-[#a5b4fc] text-[#4f46e5] font-medium'
                          : 'bg-[#f9fafb] border border-[#e4e2e6] text-[#6b7280] hover:bg-[#f3f4f6]'
                      } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isCorrectRevealed ? 'border-[#16a34a] bg-[#16a34a]'
                          : isWrongSelected ? 'border-[#dc2626] bg-[#dc2626]'
                          : selected ? 'border-[#6366f1] bg-[#6366f1]'
                          : 'border-[#d1d5db]'
                      }`}>
                        {(selected || isCorrectRevealed) && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      {opt.optionText}
                      {isCorrectRevealed && (
                        <span className="ml-auto text-[#16a34a]">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </span>
                      )}
                      {isWrongSelected && (
                        <span className="ml-auto text-[#dc2626]">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#9ca3af] mt-2 pl-5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        {/* Submit */}
        {!showResult && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl border border-[#e4e2e6] px-5 py-4">
            <p className="text-sm text-[#6b7280]">
              {answeredCount < totalQ
                ? `${totalQ - answeredCount} question${totalQ - answeredCount !== 1 ? 's' : ''} unanswered`
                : 'All questions answered'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitMutation.isPending && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
              {submitMutation.isPending ? 'Submitting…' : 'Submit Quiz'}
            </button>
          </div>
        )}

        {showResult && (
          <div className="mt-6 flex justify-center">
            <Link to="/student/quizzes"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>Back to Quizzes
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
