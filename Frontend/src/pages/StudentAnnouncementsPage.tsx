import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import { apiGet } from '../lib/api';

interface Announcement {
  id: number;
  title: string;
  content: string;
  batchId: number | null;
  batchName: string | null;
  publishedByName: string | null;
  createdAt: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hrs < 24)   return `${hrs}h ago`;
  if (days < 7)   return `${days}d ago`;
  return fmtDate(d);
}

export default function StudentAnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['student-announcements'],
    queryFn: apiGet('/student/announcements'),
  });

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Announcements</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
            {announcements.length > 0
              ? `${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}`
              : 'Notices from your teachers will appear here'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading…</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            <p className="text-[13px] font-medium">No announcements yet</p>
            <p className="text-[11px] mt-1">Your teachers haven't posted any announcements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#6366f1]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] sm:text-[13px] font-semibold text-[#0f172a]">{a.title}</p>
                      <span className="text-[10px] text-[#94a3b8] shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5">
                      {a.publishedByName}
                      {a.batchName && <> · <span className="text-[#6366f1]">{a.batchName}</span></>}
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-[#6b7280] mt-2 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
