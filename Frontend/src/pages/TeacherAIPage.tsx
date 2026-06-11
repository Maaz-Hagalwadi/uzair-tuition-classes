import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api, { apiGet } from '../lib/api';

type Tab = 'quiz' | 'assignment';

interface Batch { id: number; name: string; status: string; courseName: string; }
interface GeneratedOption { text: string; correct: boolean; }
interface GeneratedQuestion { questionText: string; options: GeneratedOption[]; }
interface AssignmentDraft { title: string; description: string; criteria: string; }

export default function TeacherAIPage() {
  const [tab, setTab] = useState<Tab>('quiz');
  const qc = useQueryClient();

  // ── Quiz generator ─────────────────────────────────────────────────────────
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizBatchId, setQuizBatchId] = useState<number | ''>('');
  const [quizTimeLimit, setQuizTimeLimit] = useState<number | ''>('');
  const [quizCreated, setQuizCreated] = useState(false);

  // ── Assignment generator ───────────────────────────────────────────────────
  const [asgTopic, setAsgTopic] = useState('');
  const [asgContext, setAsgContext] = useState('');
  const [draft, setDraft] = useState<AssignmentDraft | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCriteria, setEditCriteria] = useState('');
  const [asgBatchId, setAsgBatchId] = useState<number | ''>('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgMaxMarks, setAsgMaxMarks] = useState(100);
  const [asgCreated, setAsgCreated] = useState(false);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: apiGet('/teacher/batches'),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const generateQuiz = useMutation({
    mutationFn: () => api.post<GeneratedQuestion[]>('/teacher/ai/quiz-questions', { topic, difficulty, count }),
    onSuccess: (res) => {
      setQuestions(res.data);
      setQuizTitle(topic);
      setQuizCreated(false);
    },
  });

  const createQuiz = useMutation({
    mutationFn: async () => {
      const quizRes = await api.post<{ id: number }>('/teacher/quizzes', {
        title: quizTitle || topic,
        batchId: quizBatchId,
        timeLimitMinutes: quizTimeLimit || null,
      });
      const newQuizId = quizRes.data.id;
      for (const q of questions) {
        await api.post(`/teacher/quizzes/${newQuizId}/questions`, {
          questionText: q.questionText,
          marks: 1,
          options: q.options.map(o => ({ optionText: o.text, isCorrect: o.correct })),
        });
      }
      return newQuizId;
    },
    onSuccess: () => {
      setQuizCreated(true);
      qc.invalidateQueries({ queryKey: ['teacher-quizzes'] });
    },
  });

  const generateAssignment = useMutation({
    mutationFn: () => api.post<AssignmentDraft>('/teacher/ai/assignment', { topic: asgTopic, context: asgContext }),
    onSuccess: (res) => {
      setDraft(res.data);
      setEditTitle(res.data.title);
      setEditDescription(res.data.description);
      setEditCriteria(res.data.criteria);
      setAsgCreated(false);
    },
  });

  const createAssignment = useMutation({
    mutationFn: () => api.post('/teacher/assignments', {
      title: editTitle,
      description: editDescription + (editCriteria.trim() ? '\n\nMarking Criteria:\n' + editCriteria : ''),
      batchId: asgBatchId,
      dueDate: asgDueDate ? asgDueDate + 'T23:59:00' : null,
      maxMarks: asgMaxMarks,
      attachmentUrl: null,
    }),
    onSuccess: () => {
      setAsgCreated(true);
      qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });

  const canCreateQuiz = quizTitle.trim().length > 0 && quizBatchId !== '' && questions.length > 0;
  const canCreateAssignment = editTitle.trim().length > 0 && asgBatchId !== '';

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] sm:text-[28px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            AI Tools
          </h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">Generate quiz questions and assignments with AI</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f1f5f9] rounded-xl p-1 w-fit">
          {([['quiz', 'quiz', 'Quiz Generator'], ['assignment', 'assignment', 'Assignment Generator']] as const).map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === key ? 'bg-white text-[#070235] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
              <span className="material-symbols-outlined text-[15px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ── Quiz Generator ── */}
        {tab === 'quiz' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Generate Quiz Questions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Topic *</label>
                  <input value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Newton's Laws of Motion, Quadratic Equations…"
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Difficulty</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]">
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Number of Questions</label>
                  <input type="number" min={1} max={10} value={count} onChange={e => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                </div>
              </div>
              <button onClick={() => generateQuiz.mutate()} disabled={!topic.trim() || generateQuiz.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {generateQuiz.isPending
                  ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Generating…</>
                  : <><span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Generate Questions</>}
              </button>
              {generateQuiz.isError && (
                <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Failed to generate. Please try again.
                </p>
              )}
            </div>

            {questions.length > 0 && (
              <>
                <p className="text-[13px] font-semibold text-[#374151]">{questions.length} questions generated</p>
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm space-y-3">
                    <p className="text-[13px] font-semibold text-[#0f172a]">
                      <span className="text-[#6366f1] mr-1.5">{idx + 1}.</span>{q.questionText}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((o, oi) => (
                        <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] ${o.correct ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] font-medium' : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#374151]'}`}>
                          {o.correct && <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                          {o.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {!quizCreated ? (
                  <div className="bg-[#fafbff] rounded-2xl border border-[#6366f1]/20 p-5 space-y-4">
                    <h3 className="text-[14px] font-semibold text-[#0f172a] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#6366f1]">add_circle</span>
                      Create Quiz with These Questions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Quiz Title *</label>
                        <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                          placeholder="Quiz title…"
                          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Batch *</label>
                        <select value={quizBatchId} onChange={e => setQuizBatchId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]">
                          <option value="">— Select batch —</option>
                          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Time Limit (minutes, optional)</label>
                        <input type="number" min={1} value={quizTimeLimit} onChange={e => setQuizTimeLimit(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 30"
                          className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                      </div>
                    </div>
                    <button onClick={() => createQuiz.mutate()} disabled={!canCreateQuiz || createQuiz.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {createQuiz.isPending
                        ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Creating Quiz…</>
                        : <><span className="material-symbols-outlined text-[15px]">add</span> Create Quiz ({questions.length} questions)</>}
                    </button>
                    {createQuiz.isError && (
                      <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        Failed to create quiz. Please try again.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] p-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px] text-[#16a34a]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div>
                      <p className="text-[14px] font-semibold text-[#15803d]">Quiz created successfully!</p>
                      <p className="text-[12px] text-[#166534]">{questions.length} questions added. Go to Quizzes to review and publish it.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Assignment Generator ── */}
        {tab === 'assignment' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Generate Assignment Draft</h2>
              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Topic / Task *</label>
                <input value={asgTopic} onChange={e => setAsgTopic(e.target.value)}
                  placeholder="e.g. Write a lab report on Newton's second law…"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Additional Context (optional)</label>
                <textarea value={asgContext} onChange={e => setAsgContext(e.target.value)} rows={3}
                  placeholder="Grade level, specific requirements, topics to cover…"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
              </div>
              <button onClick={() => generateAssignment.mutate()} disabled={!asgTopic.trim() || generateAssignment.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {generateAssignment.isPending
                  ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Generating…</>
                  : <><span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Generate Draft</>}
              </button>
              {generateAssignment.isError && (
                <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Failed to generate. Please try again.
                </p>
              )}
            </div>

            {draft && !asgCreated && (
              <>
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
                  <p className="text-[12px] text-[#64748b]">Review and edit the AI draft below before publishing.</p>
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Title</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Description</label>
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={5}
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Marking Criteria</label>
                    <textarea value={editCriteria} onChange={e => setEditCriteria(e.target.value)} rows={4}
                      className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                  </div>
                </div>

                <div className="bg-[#fafbff] rounded-2xl border border-[#6366f1]/20 p-5 space-y-4">
                  <h3 className="text-[14px] font-semibold text-[#0f172a] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#6366f1]">add_circle</span>
                    Publish Assignment
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Batch *</label>
                      <select value={asgBatchId} onChange={e => setAsgBatchId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]">
                        <option value="">— Select batch —</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Max Marks</label>
                      <input type="number" min={1} value={asgMaxMarks} onChange={e => setAsgMaxMarks(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Due Date (optional)</label>
                      <input type="date" value={asgDueDate} onChange={e => setAsgDueDate(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
                    </div>
                  </div>
                  <button onClick={() => createAssignment.mutate()} disabled={!canCreateAssignment || createAssignment.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {createAssignment.isPending
                      ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Publishing…</>
                      : <><span className="material-symbols-outlined text-[15px]">send</span> Publish Assignment</>}
                  </button>
                  {createAssignment.isError && (
                    <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      Failed to create assignment. Please try again.
                    </p>
                  )}
                </div>
              </>
            )}

            {asgCreated && (
              <div className="bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] p-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-[28px] text-[#16a34a]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#15803d]">Assignment published!</p>
                  <p className="text-[12px] text-[#166534]">Students in the selected batch have been notified.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
