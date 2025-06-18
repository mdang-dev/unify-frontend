import { create } from 'zustand';

export const useBookmarkStore = create((set) => ({
  savedPostsMap: {},
  setSavedStatus: (postId, status) =>
    set((state) => ({
      savedPostsMap: {
        ...state.savedPostsMap,
        [postId]: status,
      },
    })),
  resetSavedPosts: () => set({ savedPostsMap: {} }),
}));
