import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  isHydrated: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  hydrate: () => set({ isHydrated: true }),
  get isAuthenticated() {
    return !!get().user;
  },
}));
