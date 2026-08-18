import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { executeApiRequest } from '../services/api';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      error: null,
      
      // Real login function using API
      login: async (identifier, password) => {
        try {
          set({ error: null });
          const data = await executeApiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password }),
          });
          
          if (data.success) {
            localStorage.setItem('jwt_token', data.token);
            set({ user: data.user, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (err: any) {
          set({ error: err.message || 'Login failed' });
          return false;
        }
      },
      
      logout: async () => {
        try {
          await executeApiRequest('/auth/logout', { method: 'POST' });
        } catch (e) {
          console.error("Logout API failed", e);
        }
        localStorage.removeItem('jwt_token');
        set({ user: null, isAuthenticated: false, error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
