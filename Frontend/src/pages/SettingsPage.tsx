import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardShell, { type NavItem } from '../components/DashboardShell';
import { useAuthStore } from '../stores/authStore';
import { ADMIN_NAV } from '../lib/adminNav';
import { TEACHER_NAV } from '../lib/teacherNav';
import { STUDENT_NAV } from '../lib/studentNav';

const PREFS_KEY = 'utc_preferences';

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  TEACHER: TEACHER_NAV,
  ADMIN:   ADMIN_NAV,
};

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

interface SettingRow {
  label: string;
  description: string;
  key: string;
}

const NOTIFICATION_ROWS: SettingRow[] = [
  { key: 'announcements',    label: 'Announcements',       description: 'Get notified when a new announcement is published' },
  { key: 'sessionReminders', label: 'Session Reminders',   description: 'Email reminder 1 hour before an upcoming class' },
  { key: 'paymentUpdates',   label: 'Payment Updates',     description: 'Notify when a payment status changes' },
  { key: 'enrollmentAlerts', label: 'Enrollment Alerts',   description: 'Updates on enrollment request approvals or rejections' },
];

const APPEARANCE_ROWS: SettingRow[] = [
  { key: 'compactMode',   label: 'Compact Mode',    description: 'Reduce spacing in tables and lists' },
  { key: 'showAvatars',   label: 'Show Avatars',    description: 'Display coloured initials avatars throughout the app' },
];

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] ?? 'STUDENT';
  const nav  = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.STUDENT;

  const saved_prefs = loadPrefs();

  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    saved_prefs?.notifications ?? {
      announcements:    true,
      sessionReminders: true,
      paymentUpdates:   true,
      enrollmentAlerts: false,
    }
  );

  const [appearance, setAppearance] = useState<Record<string, boolean>>(
    saved_prefs?.appearance ?? {
      compactMode: false,
      showAvatars: true,
    }
  );

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [notifications, appearance]);

  function handleSave() {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ notifications, appearance }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardShell navItems={nav}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-['Source_Serif_4'] text-[28px] font-semibold text-[#0f172a] leading-tight">Settings</h1>
          <p className="text-[13px] text-[#64748b] mt-0.5">Manage your notification and display preferences</p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#64748b]">notifications</span>
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Notifications</h2>
            </div>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">Choose which emails you want to receive</p>
          </div>
          <div className="divide-y divide-[#f8fafc]">
            {NOTIFICATION_ROWS.map(row => (
              <div key={row.key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-[13px] font-medium text-[#0f172a]">{row.label}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{row.description}</p>
                </div>
                <Toggle
                  checked={notifications[row.key]}
                  onChange={(v) => setNotifications(prev => ({ ...prev, [row.key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#64748b]">palette</span>
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Appearance</h2>
            </div>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">Customize how the interface looks</p>
          </div>
          <div className="divide-y divide-[#f8fafc]">
            {APPEARANCE_ROWS.map(row => (
              <div key={row.key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-[13px] font-medium text-[#0f172a]">{row.label}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{row.description}</p>
                </div>
                <Toggle
                  checked={appearance[row.key]}
                  onChange={(v) => setAppearance(prev => ({ ...prev, [row.key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#64748b]">account_circle</span>
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Account</h2>
            </div>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">Your account details</p>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Full Name</p>
              <p className="text-[13px] font-medium text-[#0f172a]">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Email</p>
              <p className="text-[13px] font-medium text-[#0f172a]">{user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Role</p>
              <p className="text-[13px] font-medium text-[#0f172a]">{user?.roles?.join(', ')}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Password</p>
              <Link
                to={`/${role.toLowerCase()}/profile`}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Change password
              </Link>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#16a34a]">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Preferences saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2f5a)' }}
          >
            <span className="material-symbols-outlined text-[15px]">save</span>
            Save Preferences
          </button>
        </div>

      </div>
    </DashboardShell>
  );
}
