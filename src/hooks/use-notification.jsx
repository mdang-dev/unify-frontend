'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsCommandApi } from '../apis/notifications/command/notifications.command.api';
import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { useRouter } from 'next/navigation';
import { useDesktopNotifications } from './use-desktop-notifications';

export const useNotification = (userId) => {
  const queryClient = useQueryClient();
  const stompClientRef = useRef(null);
  const router = useRouter();
  const { showNotificationByType } = useDesktopNotifications();

  // ✅ NEW: Fetch unread count separately for performance
  const { data: unreadCount = 0 } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
    queryFn: () => notificationsCommandApi.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // 🔄 Fetch notifications using React Query (with infinite scroll support)
  const { data, fetchNextPage, hasNextPage, isFetching, refetch } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, userId],
    enabled: !!userId, // Only run query if userId exists
    queryFn: ({ pageParam = 0 }) => notificationsCommandApi.fetch(userId, pageParam),
    getNextPageParam: (lastPage, pages) => {
      // Check if there are more pages based on the new API response structure
      if (lastPage && lastPage.totalPages && lastPage.currentPage < lastPage.totalPages - 1) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
  });

  // Extract notifications from the new API response structure
  const notifications = data?.pages?.flatMap(page => page.notifications || []) || [];

  // ✅ Mark a single notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: ({ notificationId }) => notificationsCommandApi.markAsRead(notificationId, userId),
    onSuccess: () => {
      // Invalidate both notifications and unread count
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  // ✅ Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: () => notificationsCommandApi.markAllAsRead(userId),
    onSuccess: () => {
      // Invalidate both notifications and unread count
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  // 📩 Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        const parsed = JSON.parse(message.body);
        
        // ✅ PERFORMANCE: Update notifications list with duplicate handling
        queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
          if (!oldData) return oldData;
          
          // Check if notification already exists (by sender, type, and recent timestamp)
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          
          const existingIndex = oldData.pages.findIndex(page => 
            page.notifications?.some(n => 
              n.sender?.id === parsed.sender?.id && 
              n.type === parsed.type &&
              new Date(n.timestamp) > fiveMinutesAgo
            )
          );

          if (existingIndex !== -1) {
            // Replace existing notification with new one
            const newPages = [...oldData.pages];
            const pageIndex = existingIndex;
            const notificationIndex = newPages[pageIndex].notifications.findIndex(n => 
              n.sender?.id === parsed.sender?.id && 
              n.type === parsed.type &&
              new Date(n.timestamp) > fiveMinutesAgo
            );
            
            if (notificationIndex !== -1) {
              newPages[pageIndex] = {
                ...newPages[pageIndex],
                notifications: [
                  ...newPages[pageIndex].notifications.slice(0, notificationIndex),
                  parsed,
                  ...newPages[pageIndex].notifications.slice(notificationIndex + 1)
                ]
              };
              return { ...oldData, pages: newPages };
            }
          }

          // Insert the new notification to the first page
          const newPages = [...oldData.pages];
          if (newPages[0] && newPages[0].notifications) {
            newPages[0] = {
              ...newPages[0],
              notifications: [parsed, ...newPages[0].notifications]
            };
          }
          return { ...oldData, pages: newPages };
        });

        // Update unread count
        queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId], (oldCount) => {
          return (oldCount || 0) + 1;
        });

        // ✅ NEW: Show desktop notification for new notifications
        showNotificationByType(parsed);
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    },
    [queryClient, userId, showNotificationByType]
  );

  // 🔌 Set up WebSocket connection and subscription
  useEffect(() => {
    if (!userId) return;
    refetch(); // Initial fetch

    const setupWebSocket = async () => {
      try {
        // Get authentication token
        const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
        if (!token) {
          console.warn('No authentication token found for notifications WebSocket');
          return;
        }
        
        // Fetch CSRF token for WebSocket connection with better error handling
        let csrfToken = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/csrf`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            csrfToken = data.token;
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`CSRF token fetch failed with status: ${response.status}`);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            if (error.name === 'AbortError') {
              console.warn('CSRF token fetch timed out');
            } else {
              console.warn('Failed to fetch CSRF token for notifications:', error.message);
            }
          }
          // Continue without CSRF token if fetch fails
        }

        const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`);
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            userId,
            token: `Bearer ${token}`,
            ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
          },
          reconnectDelay: 3000, // ✅ PERFORMANCE: Faster reconnection
          heartbeatIncoming: 15000, // ✅ PERFORMANCE: Optimized heartbeat
          heartbeatOutgoing: 15000,
          onConnect: () => {
            try {
              // Subscribe to user-specific notification queue for real-time updates
              client.subscribe(`/user/${userId}/queue/notifications`, handleWebSocketMessage);
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ Failed to subscribe to notifications:', error);
              }
            }
          },
          onStompError: (frame) => {
            // Handle STOMP protocol errors silently to avoid console spam
          },
          onWebSocketError: (event) => {
            // Handle WebSocket errors silently to avoid console spam
          },
          onWebSocketClose: (event) => {
            // Handle WebSocket close events silently to avoid console spam
          },
        });

        try {
          // Activate the STOMP client to start listening for notifications
          client.activate();
          stompClientRef.current = client;
        } catch (error) {
          // Client activation failed - handle silently
        }
      } catch (error) {
        // WebSocket setup failed - handle silently
      }
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      if (stompClientRef.current) {
        try {
          stompClientRef.current.deactivate();
        } catch (error) {
          // Handle cleanup errors silently
        }
      }
    };
  }, [userId, refetch, handleWebSocketMessage]);

  // 🧭 Navigation function for notification clicks
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
        // Extract post ID from link or notification data
        let postId = null;
        let commentId = null;
        
        if (notification.link) {
          // Extract post ID from link like "/posts/123"
          const match = notification.link.match(/\/posts\/([^\/]+)/);
          if (match) {
            postId = match[1];
          }
        }
        
        // For comment notifications, extract comment ID if available
        if (notification.type?.toLowerCase() === 'comment' && notification.data?.commentId) {
          commentId = notification.data.commentId;
        }
        
        if (postId) {
          // Open post detail modal instead of navigating
          // We'll need to pass this to the parent component
          if (typeof window !== 'undefined') {
            // Dispatch custom event to open modal
            window.dispatchEvent(new CustomEvent('openPostModal', {
              detail: { postId, commentId }
            }));
          }
        } else {
          // Fallback to navigation
          if (notification.link) {
            router.push(notification.link);
          }
        }
        break;
      case 'tag':
        // Navigate to the tagged post
        if (notification.link) {
          router.push(notification.link);
        }
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  }, [markAsRead, router]);

  return {
    notifications,
    unreadCount,
    fetchNextPage,
    hasNextPage,
    isFetching,
    markAsRead,
    markAllAsRead,
    refetch,
    handleNotificationClick, // ✅ NEW: Navigation function
  };
};
