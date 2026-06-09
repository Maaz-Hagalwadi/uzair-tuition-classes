import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId: number | null;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  ENROLLMENT_APPROVED: { icon: 'check_circle',    color: '#16a34a', bg: '#f0fdf4' },
  ENROLLMENT_REJECTED: { icon: 'cancel',          color: '#dc2626', bg: '#fef2f2' },
  ENROLLMENT_REQUEST:  { icon: 'person_add',      color: '#0891b2', bg: '#ecfeff' },
  NEW_ANNOUNCEMENT:    { icon: 'campaign',         color: '#7c3aed', bg: '#f5f3ff' },
  NEW_SESSION:         { icon: 'calendar_month',   color: '#2563eb', bg: '#eff6ff' },
  PAYMENT_UPDATED:     { icon: 'payments',         color: '#d97706', bg: '#fffbeb' },
  NEW_LEAD:            { icon: 'contact_phone',    color: '#0f172a', bg: '#f1f5f9' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getNotificationLink(type: string, role: string): string {
  const r = role.toLowerCase();
  switch (type) {
    case 'ENROLLMENT_REQUEST':  return r === 'admin' ? '/admin/enrollments' : `/${r}/batches`;
    case 'ENROLLMENT_APPROVED': return '/student/courses';
    case 'ENROLLMENT_REJECTED': return '/student/browse';
    case 'NEW_ANNOUNCEMENT':    return r === 'student' ? '/student/announcements' : `/${r}/batches`;
    case 'NEW_SESSION':         return r === 'student' ? '/student/schedule' : `/${r}/batches`;
    case 'PAYMENT_UPDATED':     return r === 'student' ? '/student/payments' : '/admin/payments';
    case 'NEW_LEAD':            return '/admin/leads';
    default:                    return `/${r}`;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc  = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const role = user?.roles?.[0] ?? 'STUDENT';
  const notifPath = `/${role.toLowerCase()}/notifications`;

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['notification-unread-count'],
    queryFn: async () => (await api.get('/notifications/unread-count')).data,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Auto-mark all read when the panel is opened
  useEffect(() => {
    if (open && (countData?.count ?? 0) > 0) {
      markAllRead.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const unread = countData?.count ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[#6b7280] hover:bg-[#f8fafc] hover:text-[#111827] transition-colors"
      >
        <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: "'wght' 300" }}>
          notifications
        </span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-[3px] rounded-full bg-[#ef4444] flex items-center justify-center text-white text-[8px] font-bold leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#e8eaf0] shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-[#0f172a]">Notifications</p>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#ef4444] text-white text-[9px] font-bold">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[11px] font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List — only unread */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.filter(n => !n.read).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
                <span className="material-symbols-outlined text-[30px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  done_all
                </span>
                <p className="text-[12px]">You're all caught up!</p>
              </div>
            ) : (
              notifications.filter(n => !n.read).map(n => {
                const meta = TYPE_META[n.type] ?? TYPE_META.NEW_ANNOUNCEMENT;
                const link = getNotificationLink(n.type, role);
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      markRead.mutate(n.id);
                      setOpen(false);
                      navigate(link);
                    }}
                    className="flex items-start gap-3 px-4 py-3 border-b border-[#f8fafc] last:border-0 cursor-pointer bg-[#fafbff] hover:bg-[#f1f5f9] transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <span className="material-symbols-outlined text-[15px]" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>
                        {meta.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[12px] leading-snug font-semibold text-[#0f172a]">
                          {n.title}
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] shrink-0 mt-1" />
                      </div>
                      <p className="text-[11px] text-[#64748b] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-[#94a3b8] mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#f1f5f9]">
            <Link
              to={notifPath}
              onClick={() => setOpen(false)}
              className="block text-center text-[12px] font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
