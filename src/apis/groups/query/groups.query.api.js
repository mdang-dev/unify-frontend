import httpClient from '@/src/utils/http-client.util';

const url = '/groups';

export const groupsQueryApi = {
    // Get all groups
    getGroups: async () => {
        try {
            const res = await httpClient(`${url}`);
            return res.data; // Backend returns List<GroupDTO> directly
        } catch (error) {
            console.error('Error fetching groups:', error);
            throw error;
        }
    },

    // Get groups by user (groups user is member of)
    getGroupsByUser: async (userId, pageParam = 0, pageSize = 10) => {
        try {
            const res = await httpClient(`${url}/user/${userId}`, {
                params: {
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                groups: res?.data?.groups ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error fetching user groups:', error);
            throw error;
        }
    },

    // Get groups created by user
    getGroupsCreatedByUser: async (userId, pageParam = 0, pageSize = 10) => {
        try {
            const res = await httpClient(`${url}/created/${userId}`, {
                params: {
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                groups: res?.data?.groups ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error fetching created groups:', error);
            throw error;
        }
    },

    // Get group details by ID
    getGroupById: async (groupId) => {
        try {
            const res = await httpClient(`${url}/${groupId}`);
            return res.data;
        } catch (error) {
            console.error('Error fetching group details:', error);
            throw error;
        }
    },

    // Get group members
    getGroupMembers: async (groupId, pageParam = 0, pageSize = 20) => {
        try {
            const res = await httpClient(`${url}/${groupId}/members`, {
                params: {
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                members: res?.data?.members ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error fetching group members:', error);
            throw error;
        }
    },

    // Get group posts
    getGroupPosts: async (groupId, pageParam = 0, pageSize = 10) => {
        try {
            const res = await httpClient(`${url}/${groupId}/posts`, {
                params: {
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                posts: res?.data?.posts ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error fetching group posts:', error);
            throw error;
        }
    },

    // Search groups
    searchGroups: async (searchTerm, pageParam = 0, pageSize = 10) => {
        try {
            const res = await httpClient(`${url}/search`, {
                params: {
                    q: searchTerm,
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                groups: res?.data?.groups ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error searching groups:', error);
            throw error;
        }
    },

    // Get popular groups
    getPopularGroups: async (pageParam = 0, pageSize = 10) => {
        try {
            const res = await httpClient(`${url}/popular`, {
                params: {
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                groups: res?.data?.groups ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error fetching popular groups:', error);
            throw error;
        }
    },

    // Get group invitations
    getGroupInvitations: async (pageParam = 0, pageSize = 10) => {
        try {
            const res = await httpClient(`${url}/invitations`, {
                params: {
                    page: pageParam,
                    size: pageSize,
                },
            });

            return {
                invitations: res?.data?.invitations ?? [],
                nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
            };
        } catch (error) {
            console.error('Error fetching group invitations:', error);
            throw error;
        }
    },

    // Check if user is member of group
    checkGroupMembership: async (groupId) => {
        try {
            const res = await httpClient(`${url}/${groupId}/membership`);
            return res.data;
        } catch (error) {
            console.error('Error checking group membership:', error);
            throw error;
        }
    },
}; 