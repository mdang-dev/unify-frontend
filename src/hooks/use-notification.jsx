'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsCommandApi } from '../apis/notifications/command/notifications.command.api';
import { useCallback } from 'react';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { useRouter } from 'next/navigation';
import { useDesktopNotifications } from './use-desktop-notifications';

export const useNotification = (userId) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showNotificationByType } = useDesktopNotifications();

  // Fetch unread count with polling for real-time updates
  const { data: unreadCount = 0 } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
    queryFn: () => notificationsCommandApi.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 10000, // Poll every 10 seconds for new notifications
  });

  // Fetch notifications with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, userId],
    queryFn: ({ pageParam = 0 }) =>
      notificationsCommandApi.fetch(userId, pageParam),
    getNextPageParam: (lastPage) => {
      // Check if there are more pages based on the API response structure
      if (lastPage && lastPage.totalPages && lastPage.currentPage < lastPage.totalPages - 1) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!userId,
    refetchInterval: 15000, // Poll every 15 seconds for new notifications
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: ({ notificationId }) =>
      notificationsCommandApi.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: () => notificationsCommandApi.markAllAsRead(userId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: ({ notificationId }) =>
      notificationsCommandApi.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    if (!notification) return;

    // Mark notification as read
    markAsRead({ notificationId: notification.id });

    // Handle different notification types
    switch (notification.type?.toLowerCase()) {
      case 'follow':
        if (notification.sender?.id) {
          router.push(`/profile/${notification.sender.id}`);
        }
        break;
      case 'like':
      case 'comment':
        // Extract post ID from multiple sources
        let postId = null;
        
        // Try to get post ID from notification data first
        if (notification.data?.postId) {
          postId = notification.data.postId;
        } else if (notification.link) {
          // Extract post ID from link like "/posts/123"
          const match = notification.link.match(/\/posts\/([^\/]+)/);
          if (match) {
            postId = match[1];
          }
        } else if (notification.postId) {
          // Direct postId field
          postId = notification.postId;
        }

        if (postId) {
          router.push(`/posts/${postId}`);
        }
        break;
      default:
        // For other notification types, try to use the link if available
        if (notification.link) {
          router.push(notification.link);
        }
        break;
    }
  }, [markAsRead, router]);

  // Extract notifications from infinite query data
  const notifications = data?.pages?.flatMap(page => page?.notifications || []) || [];

  return {
    // Data
    notifications,
    unreadCount,
    
    // Query state
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    
    // Actions
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    handleNotificationClick,
    fetchNextPage,
    refetch,
    
    // Mutation states
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeleting: deleteNotification.isPending,
  };
};
