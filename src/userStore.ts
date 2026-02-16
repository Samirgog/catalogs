import { create } from 'zustand';
import type { User, UserEntry } from './types';


interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userEntry: UserEntry | null;
  setUser: (user: User | null) => void;
  setUserEntry: (entry: UserEntry | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  userEntry: null,
  
  setUserEntry: (entry) => set({ userEntry: entry }),
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false,
    error: null 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isLoading: false, 
    error: null 
  }),
}));