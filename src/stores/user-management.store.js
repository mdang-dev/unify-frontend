import { create } from 'zustand';

export const useUserManagementStore = create((set, get) => ({
    // Filter state
    filters: {
        birthDay: '',
        email: '',
        status: '0', // Default to active users
        username: '',
        firstName: '',
        lastName: '',
    },

    // Pagination state
    currentPage: 1,
    itemsPerPage: 10,

    // Applied filters (null when no filters are applied)
    appliedFilters: null, // Start with null to trigger initialization

    // Cached data
    cachedUsers: [],
    cachedTotalPages: 0,
    cachedTotalElements: 0,
    cachedHasNext: false,
    cachedHasPrevious: false,

    // Actions
    setFilters: (filters) => set({ filters }),

    setAppliedFilters: (appliedFilters) => set({ appliedFilters }),

    setPagination: (currentPage, itemsPerPage) => set({
        currentPage,
        itemsPerPage
    }),

    setCachedData: (data) => set({
        cachedUsers: data.users || [],
        cachedTotalPages: data.totalPages || 0,
        cachedTotalElements: data.totalElements || 0,
        cachedHasNext: data.hasNext || false,
        cachedHasPrevious: data.hasPrevious || false,
    }),

    clearCache: () => set({
        filters: {
            birthDay: '',
            email: '',
            status: '0', // Reset to active users
            username: '',
            firstName: '',
            lastName: '',
        },
        currentPage: 1,
        itemsPerPage: 10,
        appliedFilters: {
            birthDay: '',
            email: '',
            status: '0', // Reset to active users
            username: '',
            firstName: '',
            lastName: '',
        }, // Reset to default filters instead of null
        cachedUsers: [],
        cachedTotalPages: 0,
        cachedTotalElements: 0,
        cachedHasNext: false,
        cachedHasPrevious: false,
    }),

    // Check if we have cached data
    hasCachedData: () => {
        const state = get();
        return state.appliedFilters !== null && state.cachedUsers.length > 0;
    },

    // Get all cached state
    getCachedState: () => {
        const state = get();
        return {
            filters: state.filters,
            currentPage: state.currentPage,
            itemsPerPage: state.itemsPerPage,
            appliedFilters: state.appliedFilters,
            cachedUsers: state.cachedUsers,
            cachedTotalPages: state.cachedTotalPages,
            cachedTotalElements: state.cachedTotalElements,
            cachedHasNext: state.cachedHasNext,
            cachedHasPrevious: state.cachedHasPrevious,
        };
    },
})); 