import { create } from 'zustand';
import { ThemeMode } from '../types';

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  toggleMode: () => set((state) => ({
    mode: state.mode === 'light' ? 'dark' : 'light',
  })),
  setMode: (mode) => set({ mode }),
}));