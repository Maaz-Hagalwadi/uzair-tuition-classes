import type { NavItem } from '../components/DashboardShell';

export const ADMIN_NAV: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', href: '/admin' },
  { icon: 'manage_accounts', label: 'Users', href: '/admin/users' },
  { icon: 'contacts', label: 'Leads', href: '/admin/leads' },
  { icon: 'menu_book', label: 'Courses', href: '/admin/courses' },
  { icon: 'groups', label: 'Batches', href: '/admin/batches' },
  { icon: 'assignment_turned_in', label: 'Enrollments', href: '/admin/enrollments' },
  { icon: 'payments',  label: 'Payments',  href: '/admin/payments' },
  { icon: 'bar_chart', label: 'Reports', href: '/admin/reports' },
  { icon: 'visibility', label: 'Visitors', href: '/admin/visitors' },
  { icon: 'history', label: 'Login History', href: '/admin/login-history' },
  { icon: 'settings', label: 'Settings', href: '/admin/settings', bottom: true },
  { icon: 'help',     label: 'Support',  href: '/admin/support',  bottom: true },
];
