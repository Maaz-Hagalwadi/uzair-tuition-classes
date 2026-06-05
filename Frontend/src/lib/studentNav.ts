import { type NavItem } from '../components/DashboardShell';

export const STUDENT_NAV: NavItem[] = [
  { icon: 'dashboard',      label: 'Dashboard',  href: '/student' },
  { icon: 'menu_book',      label: 'My Courses', href: '/student/courses' },
  { icon: 'explore',        label: 'Browse',     href: '/student/browse' },
  { icon: 'calendar_month', label: 'Schedule',   href: '/student/schedule' },
  { icon: 'quiz',           label: 'Quizzes',    href: '/student/quizzes' },
  { icon: 'fact_check',     label: 'Attendance',     href: '/student/attendance' },
  { icon: 'campaign',       label: 'Announcements', href: '/student/announcements' },
  { icon: 'payments',       label: 'Payments',       href: '/student/payments' },
  { icon: 'person',         label: 'Profile',    href: '/student/profile' },
];
