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

  // ✅ NEW: Message batching for better performance
  const messageBatchRef = useRef([]);
  const batchTimeoutRef = useRef(null);
  const BATCH_DELAY = 100; // 100ms batching

  // ✅ NEW: Process batched messages
  const processBatch = useCallback(() => {
    if (messageBatchRef.current.length === 0) return;
    
    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];
    
    // Process all notifications in batch for better performance
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
      if (!oldData) return oldData;
      
      const newPages = [...oldData.pages];
      
      // Process each notification in batch
      batch.forEach(parsed => {
        // Check if notification already exists (by sender, type, and recent timestamp)
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        const existingIndex = newPages.findIndex(page => 
          page.notifications?.some(n => 
            n.sender?.id === parsed.sender?.id && 
            n.type === parsed.type &&
            new Date(n.timestamp) > fiveMinutesAgo
          )
        );

        if (existingIndex !== -1) {
          // Replace existing notification with new one
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
          }
        } else {
          // Insert the new notification to the first page
          if (newPages[0] && newPages[0].notifications) {
            newPages[0] = {
              ...newPages[0],
              notifications: [parsed, ...newPages[0].notifications]
            };
          }
        }
      });
      
      return { ...oldData, pages: newPages };
    });

    // Update unread count in batch
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId], (oldCount) => {
      return (oldCount || 0) + batch.length;
    });

    // Show desktop notifications for all batched messages
    batch.forEach(parsed => {
      showNotificationByType(parsed);
    });
  }, [queryClient, userId, showNotificationByType]);

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
        
        // Add to batch
        messageBatchRef.current.push(parsed);
        clearTimeout(batchTimeoutRef.current); // Clear any pending batch
        batchTimeoutRef.current = setTimeout(processBatch, BATCH_DELAY);

      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    },
    [processBatch]
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
            // Remove unnecessary warning logs
          }
        } catch (error) {
          // Only log critical CSRF token errors
          if (error.name !== 'AbortError') {
            console.error('Failed to fetch CSRF token for notifications:', error.message);
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
              // Only log critical subscription errors
              console.error('Failed to subscribe to notifications:', error);
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
          // Only log critical activation errors
          console.error('Client activation failed:', error);
        }
      } catch (error) {
        // Only log critical WebSocket setup errors
        console.error('WebSocket setup failed:', error);
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
      
      // ✅ NEW: Cleanup batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
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
        // Extract post ID from multiple sources
        let postId = null;
        let commentId = null;
        
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
        
        // For comment notifications, extract comment ID if available
        if (notification.type?.toLowerCase() === 'comment') {
          if (notification.data?.commentId) {
            commentId = notification.data.commentId;
          } else if (notification.commentId) {
            commentId = notification.commentId;
          }
        }
        
        if (postId) {
          // Open post detail modal instead of navigating
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
