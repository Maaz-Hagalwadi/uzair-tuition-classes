import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoMark } from './Logo';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import NotificationBell from './NotificationBell';

export interface NavItem {
  icon: string;
  label: string;
  href: string;
  bottom?: boolean;
}

interface Props {
  navItems: NavItem[];
  children: React.ReactNode;
}

export default function DashboardShell({ navItems, children }: Props) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* proceed */ }
    logout();
    window.location.href = '/login';
  };

  const mainNav   = navItems.filter(i => !i.bottom);
  const bottomNav = navItems.filter(i => i.bottom);
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??';
  const roleLabel: Record<string, string> = { STUDENT: 'Student', TEACHER: 'Teacher', ADMIN: 'Admin' };
  const roleProfilePath: Record<string, string> = {
    STUDENT: '/student/profile',
    TEACHER: '/teacher/profile',
    ADMIN: '/admin/profile',
  };
  const primaryRole = user?.roles[0] ?? '';
  const profilePath = roleProfilePath[primaryRole] ?? '/';

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [profileOpen]);

  return (
    <div className="flex w-screen h-screen bg-white overflow-hidden">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          bg-white border-r border-[#e8eaf0]
          flex flex-col shrink-0
          transition-all duration-300 ease-in-out
          ${collapsed ? 'lg:w-[60px]' : 'lg:w-[210px]'}
          w-[210px]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo row */}
        <div className={`flex items-center h-[52px] border-b border-[#e8eaf0] shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
          <LogoMark size={26} />
          {!collapsed && (
            <span className="text-[13px] font-bold text-[#111827] tracking-tight">Uzair TC</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {!collapsed && (
            <p className="px-2 mb-1.5 text-[9px] font-bold text-[#9ca3af] uppercase tracking-[0.1em]">
              Menu
            </p>
          )}

          {mainNav.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`
                  relative flex items-center gap-3 rounded-xl mb-[3px] text-[12px]
                  transition-all duration-150
                  ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}
                  ${active
                    ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold'
                    : 'text-[#6b7280] font-medium hover:bg-[#f8fafc] hover:text-[#374151]'}
                `}
              >
                {active && !collapsed && (
                  <span className="absolute left-[2px] top-[6px] bottom-[6px] w-1 rounded-full bg-[#0f172a]" />
                )}
                <span
                  className="material-symbols-outlined text-[17px] shrink-0"
                  style={active
                    ? { fontVariationSettings: "'FILL' 1" }
                    : { fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: collapse toggle + sign out */}
        <div className="border-t border-[#e8eaf0] py-2 px-2 shrink-0 space-y-[2px]">
          {bottomNav.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`
                  relative flex items-center gap-3 rounded-xl mb-[3px] text-[12px]
                  transition-all duration-150
                  ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}
                  ${active
                    ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold'
                    : 'text-[#6b7280] font-medium hover:bg-[#f8fafc] hover:text-[#374151]'}
                `}
              >
                {active && !collapsed && (
                  <span className="absolute left-[2px] top-[6px] bottom-[6px] w-1 rounded-full bg-[#0f172a]" />
                )}
                <span
                  className="material-symbols-outlined text-[17px] shrink-0"
                  style={active
                    ? { fontVariationSettings: "'FILL' 1" }
                    : { fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </Link>
            );
          })}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`
              hidden lg:flex items-center gap-3 rounded-lg text-[12px] font-medium
              text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#374151]
              transition-all duration-150
              ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-full px-3 py-2'}
            `}
          >
            <span className="material-symbols-outlined text-[17px] shrink-0">
              {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
            {!collapsed && 'Collapse'}
          </button>

          {/* Sign out — red */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`
              flex items-center gap-3 rounded-lg text-[12px] font-medium
              text-[#ef4444] hover:bg-[#fef2f2]
              transition-all duration-150
              ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-full px-3 py-2'}
            `}
          >
            <span className="material-symbols-outlined text-[17px] shrink-0" style={{ fontVariationSettings: "'wght' 300" }}>
              logout
            </span>
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header — right side only */}
        <header className="h-[52px] bg-white border-b border-[#e8eaf0] flex items-center px-5 gap-3 shrink-0">

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#6b7280] hover:bg-[#f8fafc] transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-symbols-outlined text-[19px]">menu</span>
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <LogoMark size={22} />
            <span className="text-[13px] font-bold text-[#111827] tracking-tight">Uzair TC</span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <NotificationBell />

          <div className="w-px h-5 bg-[#e8eaf0]" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-lg hover:bg-[#f8fafc] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#4f46e5] flex items-center justify-center shrink-0 overflow-hidden">
                {user?.profilePictureUrl
                  ? <img src={user.profilePictureUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white text-[10px] font-bold">{initials}</span>}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-semibold text-[#111827] leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-[#9ca3af] leading-none mt-[2px]">
                  {roleLabel[primaryRole] ?? primaryRole}
                </p>
              </div>
              <span className="material-symbols-outlined text-[14px] text-[#9ca3af] hidden sm:block">
                expand_more
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-[#e8eaf0] shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-[#f4f6fa]">
                  <p className="text-[12px] font-semibold text-[#111827] truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-[#9ca3af] truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to={profilePath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#374151] hover:bg-[#f8fafc] hover:text-[#111827] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'wght' 300" }}>person</span>
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'wght' 300" }}>logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
