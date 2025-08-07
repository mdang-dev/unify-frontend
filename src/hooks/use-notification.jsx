'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsCommandApi } from '../apis/notifications/command/notifications.command.api';
import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useNotification = (userId) => {
  const queryClient = useQueryClient();
  const stompClientRef = useRef(null);

  // 🔄 Fetch notifications using React Query (with infinite scroll support)
  const { data, fetchNextPage, hasNextPage, isFetching, refetch } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, userId],
    enabled: !!userId, // Only run query if userId exists
    queryFn: ({ pageParam = 1 }) => notificationsCommandApi.fetch(userId, pageParam),
    getNextPageParam: (lastPage, pages) => (lastPage.length > 0 ? pages.length + 1 : undefined),
  });

  const notifications = data?.pages?.flat() || [];

  // ✅ Mark a single notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: ({ notificationId }) => notificationsCommandApi.markAsRead(notificationId, userId),
    onSuccess: () => queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]), // Refetch after success
  });

  // ✅ Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: () => notificationsCommandApi.markAllAsRead(userId),
    onSuccess: () => queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]), // Refetch after success
  });

  // 📩 Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        const parsed = JSON.parse(message.body);
        queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
          if (!oldData) return oldData;
          const exists = oldData.pages[0]?.find((n) => n.id === parsed.id);
          if (exists) return oldData;

          // Insert the new notification to the first page
          const newPages = [...oldData.pages];
          newPages[0] = [parsed, ...newPages[0]];
          return { ...oldData, pages: newPages };
        });
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err);
      }
    },
    [queryClient, userId]
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
        
        // Fetch CSRF token for WebSocket connection
        let csrfToken = null;
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/csrf`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            csrfToken = data.token;
          } else {
            // CSRF token fetch failed - continue without it
          }
        } catch (error) {
          // CSRF token fetch error - continue without it
        }


        // Create WebSocket connection for real-time notifications
        const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws?token=${token}`, null, {
          transports: ['websocket'], // ✅ PERFORMANCE: WebSocket only
          timeout: 8000, // ✅ PERFORMANCE: Faster timeout
          heartbeat: 15000, // ✅ PERFORMANCE: Optimized heartbeat
        });
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            userId,
            token: token,
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

    return () => {
      stompClientRef.current?.deactivate(); // Disconnect on unmount
    };
  }, [userId, handleWebSocketMessage, refetch]);

  return {
    notifications,
    loading: isFetching,
    hasMore: hasNextPage,
    loadMore: fetchNextPage,
    markAsRead,
    markAllAsRead,
  };
};
