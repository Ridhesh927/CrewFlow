import { create } from 'zustand';

// Mock users for different roles
const MOCK_USERS = {
  admin: { id: 1, name: 'Admin User', email: 'admin@uptoskills.com', role: 'ADMIN', department: 'Global' },
  seniortl: { id: 2, name: 'Senior TL User', email: 'seniortl@uptoskills.com', role: 'SENIOR_TL', department: 'MERN Stack' },
  tl: { id: 3, name: 'Team Lead User', email: 'tl@uptoskills.com', role: 'TL', department: 'MERN Stack' },
  captain: { id: 4, name: 'Captain User', email: 'captain@uptoskills.com', role: 'CAPTAIN', department: 'MERN Stack' },
  intern: { id: 5, name: 'Intern User', email: 'intern@uptoskills.com', role: 'INTERN', department: 'MERN Stack' },
};

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  
  // Simulated login function
  login: (roleKey) => {
    const user = MOCK_USERS[roleKey];
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },
  
  logout: () => set({ user: null, isAuthenticated: false }),
}));
