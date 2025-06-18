import { create } from 'zustand';

export const useUserStore = create((set) => ({
  isDataLoaded: false,
  setIsDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
}));
