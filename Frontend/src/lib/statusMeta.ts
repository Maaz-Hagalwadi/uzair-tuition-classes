// Shared status metadata — Tailwind-class form used by Admin pages,
// inline-style form used by Teacher/Student pages.

export const COURSE_STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE:   { bg: 'bg-[#d8f4e4]', text: 'text-[#0a3320]', dot: 'bg-[#1a6b3a]' },
  DRAFT:    { bg: 'bg-[#fef9c3]', text: 'text-[#713f12]', dot: 'bg-[#ca8a04]' },
  INACTIVE: { bg: 'bg-[#e4e2e6]', text: 'text-[#47464f]', dot: 'bg-[#787680]' },
};

export const BATCH_STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING:  { bg: 'bg-[#d0e1fb]', text: 'text-[#0b1c30]', dot: 'bg-[#1565c0]' },
  ACTIVE:    { bg: 'bg-[#d8f4e4]', text: 'text-[#0a3320]', dot: 'bg-[#1a6b3a]' },
  COMPLETED: { bg: 'bg-[#e4e2e6]', text: 'text-[#47464f]', dot: 'bg-[#787680]' },
};

export const BATCH_STATUS_INLINE_META: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING:  { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  ACTIVE:    { bg: '#f0fdf4', text: '#15803d', dot: '#16a34a' },
  COMPLETED: { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' },
};

export const BATCH_BROWSE_STATUS_META: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  ACTIVE:    { label: 'Active',    color: '#15803d', dot: '#22c55e', bg: '#f0fdf4' },
  UPCOMING:  { label: 'Upcoming',  color: '#1d4ed8', dot: '#60a5fa', bg: '#eff6ff' },
  COMPLETED: { label: 'Completed', color: '#64748b', dot: '#94a3b8', bg: '#f8fafc' },
};

export const QUIZ_STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#f3f4f6', text: '#6b7280' },
  PUBLISHED: { label: 'Published', bg: '#f0fdf4', text: '#16a34a' },
  CLOSED:    { label: 'Closed',    bg: '#fef2f2', text: '#dc2626' },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  PENDING: { label: 'Pending', bg: '#fff7ed', text: '#c2410c', icon: 'schedule' },
  PAID:    { label: 'Paid',    bg: '#f0fdf4', text: '#16a34a', icon: 'check_circle' },
  OVERDUE: { label: 'Overdue', bg: '#fef2f2', text: '#dc2626', icon: 'warning' },
  WAIVED:  { label: 'Waived',  bg: '#f3f4f6', text: '#6b7280', icon: 'do_not_disturb_on' },
};

export const LEAD_STATUS_META: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  NEW:       { label: 'New',       dot: 'bg-[#e8740c]', text: 'text-[#6b3800]', bg: 'bg-[#ffddb3]' },
  CONTACTED: { label: 'Contacted', dot: 'bg-[#1565c0]', text: 'text-[#0d2a5c]', bg: 'bg-[#d0e1fb]' },
  ENROLLED:  { label: 'Enrolled',  dot: 'bg-[#1a6b3a]', text: 'text-[#0a3320]', bg: 'bg-[#d8f4e4]' },
  CLOSED:    { label: 'Closed',    dot: 'bg-[#787680]', text: 'text-[#47464f]', bg: 'bg-[#e4e2e6]' },
};

export const ATTENDANCE_STATUS_META = {
  PRESENT: { label: 'Present', color: '#16a34a', dot: '#22c55e', bg: '#f0fdf4' },
  LATE:    { label: 'Late',    color: '#d97706', dot: '#f59e0b', bg: '#fffbeb' },
  ABSENT:  { label: 'Absent',  color: '#dc2626', dot: '#ef4444', bg: '#fef2f2' },
} as const;
