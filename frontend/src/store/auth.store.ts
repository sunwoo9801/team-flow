import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        sessionStorage.setItem('access_token', accessToken);
        set({ user, accessToken });
      },
      setAccessToken: token => {
        sessionStorage.setItem('access_token', token);
        set({ accessToken: token });
      },
      updateUser: user => set({ user }),
      clearAuth: () => {
        sessionStorage.removeItem('access_token');
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({ user: state.user }),
    }
  )
);
