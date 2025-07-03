import httpClient from '@/src/utils/http-client.util';

const url = '/groups';

export const groupsCommandApi = {
    // Create a new group
    createGroup: async (groupData, ownerId) => {
        try {
            const res = await httpClient.post(url, groupData, {
                params: { ownerId }
            });
            return res.data;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    },

    // Update group details
    updateGroup: async (groupId, groupData) => {
        try {
            const res = await httpClient.put(`${url}/${groupId}`, groupData);
            return res.data;
        } catch (error) {
            console.error('Error updating group:', error);
            throw error;
        }
    },

    // Delete group
    deleteGroup: async (groupId) => {
        try {
            const res = await httpClient.delete(`${url}/${groupId}`);
            return res.data;
        } catch (error) {
            console.error('Error deleting group:', error);
            throw error;
        }
    },

    // Join group
    joinGroup: async (groupId) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/join`);
            return res.data;
        } catch (error) {
            console.error('Error joining group:', error);
            throw error;
        }
    },

    // Leave group
    leaveGroup: async (groupId) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/leave`);
            return res.data;
        } catch (error) {
            console.error('Error leaving group:', error);
            throw error;
        }
    },

    // Invite user to group
    inviteUserToGroup: async (groupId, userId) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/invite`, { userId });
            return res.data;
        } catch (error) {
            console.error('Error inviting user to group:', error);
            throw error;
        }
    },

    // Accept group invitation
    acceptGroupInvitation: async (invitationId) => {
        try {
            const res = await httpClient.post(`${url}/invitations/${invitationId}/accept`);
            return res.data;
        } catch (error) {
            console.error('Error accepting group invitation:', error);
            throw error;
        }
    },

    // Decline group invitation
    declineGroupInvitation: async (invitationId) => {
        try {
            const res = await httpClient.post(`${url}/invitations/${invitationId}/decline`);
            return res.data;
        } catch (error) {
            console.error('Error declining group invitation:', error);
            throw error;
        }
    },

    // Remove member from group
    removeMemberFromGroup: async (groupId, userId) => {
        try {
            const res = await httpClient.delete(`${url}/${groupId}/members/${userId}`);
            return res.data;
        } catch (error) {
            console.error('Error removing member from group:', error);
            throw error;
        }
    },

    // Update member role in group
    updateMemberRole: async (groupId, userId, role) => {
        try {
            const res = await httpClient.put(`${url}/${groupId}/members/${userId}/role`, { role });
            return res.data;
        } catch (error) {
            console.error('Error updating member role:', error);
            throw error;
        }
    },

    // Create group post
    createGroupPost: async (groupId, postData) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/posts`, postData);
            return res.data;
        } catch (error) {
            console.error('Error creating group post:', error);
            throw error;
        }
    },

    // Update group settings
    updateGroupSettings: async (groupId, settings) => {
        try {
            const res = await httpClient.put(`${url}/${groupId}/settings`, settings);
            return res.data;
        } catch (error) {
            console.error('Error updating group settings:', error);
            throw error;
        }
    },

    // Archive group
    archiveGroup: async (groupId) => {
        try {
            const res = await httpClient.put(`${url}/${groupId}/archive`);
            return res.data;
        } catch (error) {
            console.error('Error archiving group:', error);
            throw error;
        }
    },

    // Unarchive group
    unarchiveGroup: async (groupId) => {
        try {
            const res = await httpClient.put(`${url}/${groupId}/unarchive`);
            return res.data;
        } catch (error) {
            console.error('Error unarchiving group:', error);
            throw error;
        }
    },

    // Report group
    reportGroup: async (groupId, reportData) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/report`, reportData);
            return res.data;
        } catch (error) {
            console.error('Error reporting group:', error);
            throw error;
        }
    },

    // Block group
    blockGroup: async (groupId) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/block`);
            return res.data;
        } catch (error) {
            console.error('Error blocking group:', error);
            throw error;
        }
    },

    // Unblock group
    unblockGroup: async (groupId) => {
        try {
            const res = await httpClient.post(`${url}/${groupId}/unblock`);
            return res.data;
        } catch (error) {
            console.error('Error unblocking group:', error);
            throw error;
        }
    },
}; 