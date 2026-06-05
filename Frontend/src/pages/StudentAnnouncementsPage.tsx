import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

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
    queryFn: async () => { const { data } = await api.get('/student/announcements'); return data; },
  });

  return (
    <DashboardShell navItems={STUDENT_NAV}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1e1b4b]">Announcements</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {announcements.length > 0
              ? `${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}`
              : 'Notices from your teachers will appear here'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#6b7280]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>Loading…
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
            <span className="material-symbols-outlined text-[48px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            <p className="text-sm font-medium">No announcements yet</p>
            <p className="text-xs mt-1">Your teachers haven't posted any announcements</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-[#e4e2e6] p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[#6366f1]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#374151] text-sm">{a.title}</p>
                      <span className="text-[10px] text-[#9ca3af] shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-0.5">
                      {a.publishedByName}
                      {a.batchName && <> · <span className="text-[#6366f1]">{a.batchName}</span></>}
                    </p>
                    <p className="text-sm text-[#6b7280] mt-2 whitespace-pre-wrap leading-relaxed">{a.content}</p>
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
