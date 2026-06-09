import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  profilePictureUrl?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: 'auth' }
  )
);
