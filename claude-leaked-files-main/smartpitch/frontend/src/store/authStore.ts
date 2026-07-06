import { create } from 'zustand';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  usage?: {
    projectsThisMonth: number;
    lastGeneratedAt: Date;
  };
  githubToken?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ user, isAuthenticated: true, error: null });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    if (!localStorage.getItem('token')) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('CheckAuth error', error);
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
