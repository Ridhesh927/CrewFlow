import { create } from 'zustand';
import { executeApiRequest } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  
  // Real login function using API
  login: async (email, password) => {
    try {
      set({ error: null });
      const data = await executeApiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (data.success) {
        localStorage.setItem('jwt_token', data.token);
        set({ user: data.user, isAuthenticated: true });
        return true;
      }
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('jwt_token');
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
