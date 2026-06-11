import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

type Tab = 'insights' | 'announcement' | 'summary';
interface UserRow { id: number; firstName: string; lastName: string; email: string; roles: string[]; }
interface AnnouncementDraft { title: string; content: string; }

export default function AdminAIPage() {
  const [tab, setTab] = useState<Tab>('insights');

  // ── Insights ───────────────────────────────────────────────────────────────
  const [insights, setInsights] = useState('');

  // ── Announcement ──────────────────────────────────────────────────────────
  const [annTopic, setAnnTopic] = useState('');
  const [annAudience, setAnnAudience] = useState('All Students');
  const [annTone, setAnnTone] = useState('Friendly');
  const [annDraft, setAnnDraft] = useState<AnnouncementDraft | null>(null);
  const [annPosted, setAnnPosted] = useState(false);
  const [annError, setAnnError] = useState('');
  const [copiedAnn, setCopiedAnn] = useState<string | null>(null);

  // ── Student summary ────────────────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [summary, setSummary] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: allUsers = [] } = useQuery<UserRow[]>({
    queryKey: ['admin-students-list'],
    queryFn: async () => (await api.get('/admin/users?role=STUDENT')).data,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const insightsMutation = useMutation({
    mutationFn: () => api.post<{ text: string }>('/admin/ai/report-insights'),
    onSuccess: (res) => setInsights(res.data.text),
  });

  const announcementMutation = useMutation({
    mutationFn: () => api.post<AnnouncementDraft>('/admin/ai/announcement', {
      topic: annTopic, audience: annAudience, tone: annTone,
    }),
    onSuccess: (res) => { setAnnDraft(res.data); setAnnPosted(false); setAnnError(''); },
  });

  const postAnnouncementMutation = useMutation({
    mutationFn: () => api.post('/teacher/announcements', {
      title: annDraft!.title,
      content: annDraft!.content,
      batchId: null,
    }),
    onSuccess: () => setAnnPosted(true),
    onError: (err: any) => setAnnError(err.response?.data?.message ?? 'Failed to post.'),
  });

  const summaryMutation = useMutation({
    mutationFn: () => api.post<{ text: string }>(`/admin/ai/student-summary/${selectedStudentId}`),
    onSuccess: (res) => { setSummary(res.data.text); setSummaryCopied(false); },
  });

  function copyAnn(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedAnn(key);
    setTimeout(() => setCopiedAnn(null), 2000);
  }

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] sm:text-[28px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            AI Tools
          </h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">AI-powered insights, announcements, and student reports</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-[#f1f5f9] rounded-xl p-1 w-fit">
          {([
            ['insights', 'bar_chart', 'Report Insights'],
            ['announcement', 'campaign', 'Draft Announcement'],
            ['summary', 'person', 'Student Summary'],
          ] as const).map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all ${tab === key ? 'bg-white text-[#070235] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
              <span className="material-symbols-outlined text-[14px] sm:text-[15px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ── Report Insights Tab ── */}
        {tab === 'insights' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold text-[#0f172a]">Analyse Your Reports</h2>
                <p className="text-[12px] text-[#64748b] mt-0.5">AI reads your live analytics data and summarises key observations.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => insightsMutation.mutate()} disabled={insightsMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {insightsMutation.isPending
                    ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Analysing…</>
                    : <><span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Analyse Reports</>}
                </button>
                {insights && (
                  <button onClick={() => insightsMutation.mutate()} disabled={insightsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] text-[#6366f1] font-semibold hover:bg-[#f8fafc] transition-colors">
                    <span className="material-symbols-outlined text-[15px]">refresh</span>
                    Refresh
                  </button>
                )}
              </div>
              {insightsMutation.isError && (
                <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Failed to generate insights. Please try again.
                </p>
              )}
            </div>

            {insightsMutation.isPending && <LogoSpinner message="Reading your analytics data…" py="py-12" />}

            {insights && !insightsMutation.isPending && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#0f172a]">AI Insights</p>
                </div>
                <p className="text-[13px] text-[#374151] leading-relaxed">{insights}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Draft Announcement Tab ── */}
        {tab === 'announcement' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Draft an Announcement</h2>

              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1.5">What do you want to announce? *</label>
                <textarea value={annTopic} onChange={e => setAnnTopic(e.target.value)} rows={3}
                  placeholder="e.g. Class schedule change for next week, new batch starting in January…"
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Audience</label>
                  <select value={annAudience} onChange={e => setAnnAudience(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]">
                    <option>All Students</option>
                    <option>All Teachers</option>
                    <option>Parents</option>
                    <option>Everyone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Tone</label>
                  <select value={annTone} onChange={e => setAnnTone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]">
                    <option>Friendly</option>
                    <option>Formal</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <button onClick={() => announcementMutation.mutate()} disabled={!annTopic.trim() || announcementMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {announcementMutation.isPending
                  ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Drafting…</>
                  : <><span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Generate Draft</>}
              </button>

              {announcementMutation.isError && (
                <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Failed to generate. Please try again.
                </p>
              )}
            </div>

            {annDraft && (
              <div className="space-y-3">
                {([['title', 'Title', annDraft.title], ['content', 'Content', annDraft.content]] as const).map(([key, label, value]) => (
                  <div key={key} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-[#374151]">{label}</p>
                      <button onClick={() => copyAnn(value, key)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] text-[#6366f1] font-medium hover:bg-[#eef2ff] transition-colors">
                        <span className="material-symbols-outlined text-[13px]">{copiedAnn === key ? 'check' : 'content_copy'}</span>
                        {copiedAnn === key ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[13px] text-[#0f172a] whitespace-pre-line">{value}</p>
                  </div>
                ))}

                {!annPosted ? (
                  <div className="flex items-center gap-3">
                    <button onClick={() => postAnnouncementMutation.mutate()} disabled={postAnnouncementMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {postAnnouncementMutation.isPending
                        ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Posting…</>
                        : <><span className="material-symbols-outlined text-[15px]">campaign</span> Post Announcement</>}
                    </button>
                    {annError && <p className="text-[12px] text-[#dc2626]">{annError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-[#16a34a] font-semibold">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Announcement posted successfully!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Student Summary Tab ── */}
        {tab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold text-[#0f172a]">Generate Student Progress Summary</h2>
                <p className="text-[12px] text-[#64748b] mt-0.5">AI reads a student's live data and writes a narrative suitable for parents or reviews.</p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#374151] mb-1.5">Select Student *</label>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]">
                  <option value="">— Select a student —</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                </select>
              </div>

              <button onClick={() => summaryMutation.mutate()} disabled={!selectedStudentId || summaryMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {summaryMutation.isPending
                  ? <><span className="material-symbols-outlined text-[15px] animate-spin">sync</span> Generating…</>
                  : <><span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Generate Summary</>}
              </button>

              {summaryMutation.isError && (
                <p className="text-[12px] text-[#dc2626] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Failed to generate. Please try again.
                </p>
              )}
            </div>

            {summaryMutation.isPending && <LogoSpinner message="Analysing student data…" py="py-12" />}

            {summary && !summaryMutation.isPending && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px] text-[#6366f1]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#0f172a]">Progress Summary</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(summary); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] text-[#6366f1] font-medium hover:bg-[#eef2ff] transition-colors">
                    <span className="material-symbols-outlined text-[13px]">{summaryCopied ? 'check' : 'content_copy'}</span>
                    {summaryCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[13px] text-[#374151] leading-relaxed">{summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
