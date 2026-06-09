import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell, { type NavItem } from '../components/DashboardShell';
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

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profilePictureUrl: string | null;
  roles: string[];
  createdAt: string;
}

function roleColor(role: string) {
  if (role === 'ADMIN') return 'bg-[#eaedff] text-[#070235]';
  if (role === 'TEACHER') return 'bg-[#d0e1fb] text-[#0b1c30]';
  return 'bg-[#d8f4e4] text-[#0a3320]';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
      type === 'success'
        ? 'bg-[#d8f4e4] border border-[#1a6b3a]/30 text-[#0a3320]'
        : 'bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a]'
    }`}>
      <span className="material-symbols-outlined text-[16px]">
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.accessToken);
  const role = storeUser?.roles?.[0] ?? 'STUDENT';
  const nav = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.STUDENT;
  const qc = useQueryClient();

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pictureMsg, setPictureMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const pictureMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/profile/picture', form);
    },
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      if (token) setAuth(token, { ...storeUser!, profilePictureUrl: data.profilePictureUrl });
      setPictureMsg({ text: 'Profile picture updated.', type: 'success' });
      setTimeout(() => setPictureMsg(null), 4000);
    },
    onError: (err: any) => {
      setPictureMsg({ text: err.response?.data?.message ?? 'Upload failed.', type: 'error' });
    },
  });

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile');
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => api.put('/profile', { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || null }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      // Keep Zustand store in sync
      if (token) setAuth(token, { ...storeUser!, firstName: data.firstName, lastName: data.lastName });
      setProfileMsg({ text: 'Profile updated successfully.', type: 'success' });
      setTimeout(() => setProfileMsg(null), 4000);
    },
    onError: (err: any) => {
      setProfileMsg({ text: err.response?.data?.message ?? 'Failed to update profile.', type: 'error' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.put('/profile/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ text: 'Password changed successfully.', type: 'success' });
      setTimeout(() => setPasswordMsg(null), 4000);
    },
    onError: (err: any) => {
      setPasswordMsg({ text: err.response?.data?.message ?? 'Failed to change password.', type: 'error' });
    },
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    updateMutation.mutate();
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    setPasswordMsg(null);
    passwordMutation.mutate();
  }

  if (isLoading || !profile) {
    return (
      <DashboardShell navItems={nav}>
        <div className="flex items-center justify-center py-32 text-[#787680]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
          Loading profile…
        </div>
      </DashboardShell>
    );
  }

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <DashboardShell navItems={nav}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-2">
          <h1 className="font-serif text-[20px] sm:text-[28px] leading-tight sm:leading-[36px] font-semibold text-[#070235]">
            My Profile
          </h1>
          <p className="text-[11px] sm:text-sm text-[#505f76] mt-0.5 sm:mt-1">Manage your personal information and password.</p>
        </div>

        {/* Profile header card */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl p-4 sm:p-6 flex items-center gap-4 sm:gap-5">
          {/* Avatar with upload */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#eaedff] flex items-center justify-center overflow-hidden">
                {profile.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base sm:text-xl font-bold text-[#070235]">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pictureMutation.isPending}
                className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#070235] border-2 border-white flex items-center justify-center hover:bg-[#1e1b4b] transition-colors disabled:cursor-wait"
                title="Upload photo"
              >
                {pictureMutation.isPending
                  ? <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>sync</span>
                  : <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>photo_camera</span>}
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pictureMutation.isPending}
              className="text-[10px] sm:text-[11px] font-semibold text-[#070235] hover:underline disabled:opacity-50"
            >
              {pictureMutation.isPending ? 'Uploading…' : 'Upload Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) pictureMutation.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] sm:text-lg font-semibold text-[#131b2e] truncate">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-[11px] sm:text-sm text-[#505f76] truncate">{profile.email}</p>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
              {profile.roles.map((r) => (
                <span key={r} className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${roleColor(r)}`}>
                  {r}
                </span>
              ))}
              <span className="text-[10px] sm:text-xs text-[#787680]">
                Since {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {pictureMsg && <Toast msg={pictureMsg.text} type={pictureMsg.type} />}

        {/* Edit profile card */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl p-4 sm:p-6">
          <h3 className="text-[13px] sm:text-sm font-semibold text-[#131b2e] mb-4 sm:mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#505f76]">edit</span>
            Edit Profile
          </h3>

          {profileMsg && (
            <div className="mb-5">
              <Toast msg={profileMsg.text} type={profileMsg.type} />
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">
                Email address
                <span className="ml-1.5 text-[10px] sm:text-xs font-normal text-[#787680]">(cannot be changed)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#787680]">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">mail</span>
                </span>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="block w-full pl-9 pr-4 py-2 sm:py-2.5 bg-[#f2f3ff] border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm text-[#787680] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">
                Phone <span className="font-normal text-[#787680]">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">phone</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+92 300 0000000"
                  className="block w-full pl-9 pr-4 py-2 sm:py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#070235] text-white rounded-lg text-[12px] sm:text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending && (
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] animate-spin">sync</span>
                )}
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change password card */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl p-4 sm:p-6">
          <h3 className="text-[13px] sm:text-sm font-semibold text-[#131b2e] mb-4 sm:mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#505f76]">lock</span>
            Change Password
          </h3>

          {passwordMsg && (
            <div className="mb-5">
              <Toast msg={passwordMsg.text} type={passwordMsg.type} />
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">Current password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">lock</span>
                </span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 sm:py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#505f76] hover:text-[#070235] transition-colors">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                    {showCurrent ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">New password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">lock_reset</span>
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className="block w-full pl-9 pr-10 py-2 sm:py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-[12px] sm:text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#505f76] hover:text-[#070235] transition-colors">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-sm font-semibold text-[#070235] mb-1 sm:mb-1.5">Confirm new password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#505f76]">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">lock_reset</span>
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  className={`block w-full pl-9 pr-4 py-2 sm:py-2.5 bg-white border rounded-lg text-[12px] sm:text-sm text-[#131b2e] placeholder-[#787680] focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
                      : 'border-[#c8c5d0] focus:border-[#070235] focus:ring-[#070235]/10'
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[13px] sm:text-[14px]">error</span>
                  Passwords do not match.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={passwordMutation.isPending || (!!confirmPassword && confirmPassword !== newPassword)}
                className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#070235] text-white rounded-lg text-[12px] sm:text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {passwordMutation.isPending && (
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] animate-spin">sync</span>
                )}
                {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
