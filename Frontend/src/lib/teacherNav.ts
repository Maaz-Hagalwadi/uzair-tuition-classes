import type { NavItem } from '../components/DashboardShell';

export const TEACHER_NAV: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', href: '/teacher' },
  { icon: 'groups', label: 'My Batches', href: '/teacher/batches' },
  { icon: 'person_search', label: 'Students', href: '/teacher/students' },
  { icon: 'folder_open', label: 'Materials', href: '/teacher/materials' },
  { icon: 'quiz',           label: 'Quizzes',     href: '/teacher/quizzes' },
  { icon: 'assignment',    label: 'Assignments', href: '/teacher/assignments' },
  { icon: 'campaign',     label: 'Announcements', href: '/teacher/announcements' },
  { icon: 'auto_awesome', label: 'AI Tools', href: '/teacher/ai' },
  { icon: 'settings', label: 'Settings', href: '/teacher/settings', bottom: true },
  { icon: 'help',     label: 'Support',  href: '/teacher/support',  bottom: true },
];
