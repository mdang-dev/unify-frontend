import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './use-socket';
import { followQueryApi } from '@/src/apis/follow/query/follow.query.api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

export const useRealtimeFollowingLive = (userId) => {
  const { connected: isSocketConnected, client: socketClient } = useSocket();
  const queryClient = useQueryClient();
  const [followersWithLiveStatus, setFollowersWithLiveStatus] = useState([]);

  // Fetch initial data
  const { data: initialFollowers, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.FOLLOWERS_WITH_LIVE_STATUS, userId],
    queryFn: () => followQueryApi.getFollowersWithLiveStatus(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize state with fetched data
  useEffect(() => {
    if (initialFollowers) {
      setFollowersWithLiveStatus(initialFollowers);
    }
  }, [initialFollowers]);

  // Sort followers: live users first, then offline users
  const sortedFollowers = useCallback(() => {
    return [...followersWithLiveStatus].sort((a, b) => {
      // Live users first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // If both live, sort by viewer count (descending)
      if (a.isLive && b.isLive) {
        return (b.viewerCount || 0) - (a.viewerCount || 0);
      }
      
      // If both offline, sort by username
      return a.username.localeCompare(b.username);
    });
  }, [followersWithLiveStatus]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!isSocketConnected || !socketClient || !userId) return;

    console.log('Subscribing to followers live status updates for user:', userId);
    
    const subscription = socketClient.subscribe(`/topic/users/${userId}/followers-live-status`, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log('Followers live status update received:', data);
        
        if (data.type === 'FOLLOWER_LIVE_STATUS') {
          setFollowersWithLiveStatus(prev => {
            const updated = prev.map(follower => {
              if (follower.id === data.userId) {
                return {
                  ...follower,
                  isLive: data.isLive,
                  streamTitle: data.streamTitle || null,
                  viewerCount: data.viewerCount || 0,
                  startTime: data.startTime || null,
                };
              }
              return follower;
            });
            
            // Invalidate query to refresh data
            queryClient.invalidateQueries({ 
              queryKey: [QUERY_KEYS.FOLLOWERS_WITH_LIVE_STATUS, userId] 
            });
            
            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing followers live status update:', error);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isSocketConnected, socketClient, userId, queryClient]);

  // Function to manually refresh data
  const refreshFollowers = useCallback(async () => {
    try {
      const freshData = await followQueryApi.getFollowersWithLiveStatus(userId);
      setFollowersWithLiveStatus(freshData);
      return freshData;
    } catch (error) {
      console.error('Error refreshing followers:', error);
      throw error;
    }
  }, [userId]);

  return {
    followers: sortedFollowers(),
    isLoading,
    error,
    refreshFollowers,
    isSocketConnected,
  };
};
