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
            console.log('CSRF token fetched for notifications');
          } else {
            console.warn('Failed to fetch CSRF token, status:', response.status);
          }
        } catch (error) {
          console.warn('Failed to fetch CSRF token for notifications:', error);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('Setting up WebSocket connection for notifications...');
        }
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
              client.subscribe(`/user/${userId}/queue/notifications`, handleWebSocketMessage);
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ WebSocket connected for notifications');
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ Failed to subscribe to notifications:', error);
              }
            }
          },
          onStompError: (frame) => {
            console.error('❌ STOMP error in notifications:', frame);
            console.error('Error details:', frame.headers?.message || 'Unknown error');
            console.error('Error headers:', frame.headers);
          },
          onWebSocketError: (event) => {
            console.error('❌ WebSocket error in notifications:', event);
            console.error('Error type:', event.type);
            console.error('Error target:', event.target);
          },
          onWebSocketClose: (event) => {
            console.log('🔌 WebSocket closed for notifications:', event);
            console.log('Close code:', event.code);
            console.log('Close reason:', event.reason);
          },
        });

        try {
          client.activate();
          stompClientRef.current = client;
          console.log('WebSocket client activated for notifications');
        } catch (error) {
          console.error('❌ Failed to activate WebSocket client for notifications:', error);
        }
      } catch (error) {
        console.error('❌ Failed to setup WebSocket for notifications:', error);
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
