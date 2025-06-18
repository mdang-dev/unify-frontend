import { create } from 'zustand';

export const useReportStore = create((set) => ({
  pendingReports: [],
  approvedReports: [],
  setPendingReports: (reports) => set({ pendingReports: reports }),
  setApprovedReports: (reports) => set({ approvedReports: reports }),
  addPendingReport: (report) =>
    set((state) => ({
      pendingReports: [...state.pendingReports, report],
    })),
}));
