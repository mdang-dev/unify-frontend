import { create } from 'zustand';

export const usePostManagementStore = create((set, get) => ({
    // Filter state
    filters: {
        captions: '',
        status: '',
        audience: '',
        isCommentVisible: '',
        isLikeVisible: '',
        hashtag: '', // Changed from hashtags to hashtag
        commentCount: '',
        commentCountOperator: '=',
    },

    // Pagination state
    currentPage: 1,
    itemsPerPage: 10,

    // Applied filters (null when no filters are applied)
    appliedFilters: null,

    // Cached data
    cachedPosts: [],
    cachedHasNextPage: false,
    cachedCurrentPage: 0,
    cachedTotal: 0,
    cachedTotalPages: 0,
    cachedPageSize: 20,

    // Actions
    setFilters: (filters) => set({ filters }),

    setAppliedFilters: (appliedFilters) => {
        // Convert status to integer if it's not empty
        const processedFilters = { ...appliedFilters };
        if (processedFilters.status !== '' && processedFilters.status !== null && processedFilters.status !== undefined) {
            processedFilters.status = parseInt(processedFilters.status, 10);
        }
        // Convert commentCount to number if it's not empty
        if (processedFilters.commentCount !== '' && processedFilters.commentCount !== null && processedFilters.commentCount !== undefined) {
            processedFilters.commentCount = parseInt(processedFilters.commentCount, 10);
        }
        // Convert boolean values
        if (processedFilters.isCommentVisible !== '' && processedFilters.isCommentVisible !== null && processedFilters.isCommentVisible !== undefined) {
            processedFilters.isCommentVisible = processedFilters.isCommentVisible === 'true';
        }
        if (processedFilters.isLikeVisible !== '' && processedFilters.isLikeVisible !== null && processedFilters.isLikeVisible !== undefined) {
            processedFilters.isLikeVisible = processedFilters.isLikeVisible === 'true';
        }
        set({ appliedFilters: processedFilters });
    },

    setPagination: (currentPage, itemsPerPage) => set({
        currentPage,
        itemsPerPage
    }),

    setCachedData: (data) => set({
        cachedPosts: data.posts || [],
        cachedHasNextPage: data.hasNextPage || false,
        cachedCurrentPage: data.currentPage || 0,
        cachedTotal: data.total || 0,
        cachedTotalPages: data.totalPages || 0,
        cachedPageSize: data.pageSize || 20,
    }),

    clearCache: () => set({
        filters: {
            captions: '',
            status: '',
            audience: '',
            isCommentVisible: '',
            isLikeVisible: '',
            hashtag: '', // Changed from hashtags to hashtag
            commentCount: '',
            commentCountOperator: '=',
        },
        currentPage: 1,
        itemsPerPage: 10,
        appliedFilters: null,
        cachedPosts: [],
        cachedHasNextPage: false,
        cachedCurrentPage: 0,
        cachedTotal: 0,
        cachedTotalPages: 0,
        cachedPageSize: 20,
    }),

    // Check if we have cached data
    hasCachedData: () => {
        const state = get();
        return state.appliedFilters !== null && state.cachedPosts.length > 0;
    },

    // Get all cached state
    getCachedState: () => {
        const state = get();
        return {
            filters: state.filters,
            currentPage: state.currentPage,
            itemsPerPage: state.itemsPerPage,
            appliedFilters: state.appliedFilters,
            cachedPosts: state.cachedPosts,
            cachedHasNextPage: state.cachedHasNextPage,
            cachedCurrentPage: state.cachedCurrentPage,
            cachedTotal: state.cachedTotal,
            cachedTotalPages: state.cachedTotalPages,
            cachedPageSize: state.cachedPageSize,
        };
    },
})); 