import { create } from 'zustand';

export const useFollowStore = create((set) => ({
  followingStatus: {},
  setFollowingStatus: (userId, status) =>
    set((state) => ({
      followingStatus: {
        ...state.followingStatus,
        [userId]: status,
      },
    })),
}));
