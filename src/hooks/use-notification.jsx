'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsCommandApi } from '../apis/notifications/command/notifications.command.api';
import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { QUERY_KEYS } from '../constants/query-keys.constant';

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

    const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${userId}/queue/notifications`, handleWebSocketMessage);
        console.log('✅ WebSocket connected');
      },
      onStompError: (frame) => console.error('❌ STOMP error:', frame),
    });

    client.activate();
    stompClientRef.current = client;

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
