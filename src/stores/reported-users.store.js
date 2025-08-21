import { create } from 'zustand';

export const useReportedUsersStore = create((set, get) => ({
    // Filter state
    filters: {
        status: '0', // Default to pending status
        reportedAtFrom: null,
        reportedAtTo: null,
    },

    // Pagination and sorting state
    currentPage: 1,
    itemsPerPage: 20,
    sortField: 'latestReportedAt',
    sortDirection: 'desc',

    // Applied filters (null when no filters are applied)
    appliedFilters: { status: 0 }, // Default to pending status filter

    // Cached data
    cachedReportedUsers: [],
    cachedTotalPages: 0,
    cachedTotalElements: 0,
    cachedHasNext: false,
    cachedHasPrevious: false,

    // Actions
    setFilters: (filters) => set({ filters }),

    setAppliedFilters: (appliedFilters) => {
        // Process filters before setting
        const processedFilters = { ...appliedFilters };

        // Convert status to integer if it's not empty
        if (processedFilters.status !== '' && processedFilters.status !== null && processedFilters.status !== undefined) {
            processedFilters.status = parseInt(processedFilters.status, 10);
        }

        set({ appliedFilters: processedFilters });
    },

    setPagination: (currentPage, itemsPerPage) => set({
        currentPage,
        itemsPerPage
    }),

    setSorting: (sortField, sortDirection) => set({
        sortField,
        sortDirection
    }),

    setCachedData: (data) => set({
        cachedReportedUsers: data.content || [],
        cachedTotalPages: data.totalPages || 0,
        cachedTotalElements: data.totalElements || 0,
        cachedHasNext: !data.last || false,
        cachedHasPrevious: data.first === false || false,
    }),

    clearCache: () => set({
        filters: {
            status: '0', // Reset to pending status
            reportedAtFrom: null,
            reportedAtTo: null,
        },
        currentPage: 1,
        itemsPerPage: 20,
        sortField: 'latestReportedAt',
        sortDirection: 'desc',
        appliedFilters: { status: 0 }, // Reset to pending status filter
        cachedReportedUsers: [],
        cachedTotalPages: 0,
        cachedTotalElements: 0,
        cachedHasNext: false,
        cachedHasPrevious: false,
    }),

    // Check if we have cached data
    hasCachedData: () => {
        const state = get();
        return state.appliedFilters !== null && state.cachedReportedUsers.length > 0;
    },

    // Get all cached state
    getCachedState: () => {
        const state = get();
        return {
            filters: state.filters,
            currentPage: state.currentPage,
            itemsPerPage: state.itemsPerPage,
            sortField: state.sortField,
            sortDirection: state.sortDirection,
            appliedFilters: state.appliedFilters,
            cachedReportedUsers: state.cachedReportedUsers,
            cachedTotalPages: state.cachedTotalPages,
            cachedTotalElements: state.cachedTotalElements,
            cachedHasNext: state.cachedHasNext,
            cachedHasPrevious: state.cachedHasPrevious,
        };
    },
}));
