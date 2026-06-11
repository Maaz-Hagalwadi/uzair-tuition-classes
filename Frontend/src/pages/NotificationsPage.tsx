import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell, { type NavItem } from '../components/DashboardShell';
import LogoSpinner from '../components/LogoSpinner';
import { useAuthStore } from '../stores/authStore';
import { ADMIN_NAV } from '../lib/adminNav';
import { TEACHER_NAV } from '../lib/teacherNav';
import { STUDENT_NAV } from '../lib/studentNav';
import api from '../lib/api';

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  TEACHER: TEACHER_NAV,
  ADMIN:   ADMIN_NAV,
};

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId: number | null;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  ENROLLMENT_APPROVED: { icon: 'check_circle',  color: '#16a34a', bg: '#f0fdf4', label: 'Enrollment' },
  ENROLLMENT_REJECTED: { icon: 'cancel',        color: '#dc2626', bg: '#fef2f2', label: 'Enrollment' },
  ENROLLMENT_REQUEST:  { icon: 'person_add',    color: '#0891b2', bg: '#ecfeff', label: 'Request' },
  NEW_ANNOUNCEMENT:    { icon: 'campaign',       color: '#7c3aed', bg: '#f5f3ff', label: 'Announcement' },
  NEW_SESSION:         { icon: 'calendar_month', color: '#2563eb', bg: '#eff6ff', label: 'Session' },
  PAYMENT_UPDATED:     { icon: 'payments',       color: '#d97706', bg: '#fffbeb', label: 'Payment' },
  NEW_LEAD:            { icon: 'contact_phone',  color: '#0f172a', bg: '#f1f5f9', label: 'Lead' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function NotificationsPage() {
  const user = useAuthStore(s => s.user);
  const role = user?.roles?.[0] ?? 'STUDENT';
  const nav  = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.STUDENT;
  const qc   = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications-all'],
    queryFn: async () => (await api.get('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-all'] });
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-all'] });
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardShell navItems={nav}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">Notifications</h1>
            <p className="text-[13px] text-[#64748b] mt-0.5">Your recent activity and updates</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold border border-[#e2e8f0] text-[#374151] hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          {isLoading ? (
            <LogoSpinner message="Loading notifications…" py="py-20" />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
              <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px] text-[#cbd5e1]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  notifications_none
                </span>
              </div>
              <p className="text-[14px] font-semibold text-[#374151]">No notifications yet</p>
              <p className="text-[12px] text-[#94a3b8] mt-1">You'll see updates here when something happens</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {notifications.map(n => {
                const meta = TYPE_META[n.type] ?? TYPE_META.NEW_ANNOUNCEMENT;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                      n.read ? 'hover:bg-[#fafbff]' : 'bg-[#fafbff] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {meta.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-[13px] leading-snug ${n.read ? 'font-medium text-[#374151]' : 'font-semibold text-[#0f172a]'}`}>
                              {n.title}
                            </p>
                            <span
                              className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#6366f1] shrink-0" />}
                          </div>
                          <p className="text-[12px] text-[#64748b] mt-0.5">{n.message}</p>
                          <p className="text-[11px] text-[#94a3b8] mt-1">{formatDate(n.createdAt)}</p>
                        </div>

                        {!n.read && (
                          <button
                            onClick={() => markRead.mutate(n.id)}
                            className="shrink-0 text-[11px] font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors whitespace-nowrap"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
