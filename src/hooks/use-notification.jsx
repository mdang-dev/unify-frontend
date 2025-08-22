'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsCommandApi } from '../apis/notifications/command/notifications.command.api';
import { useCallback, useRef, useEffect, useState } from 'react';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { useRouter } from 'next/navigation';
import { useDesktopNotifications } from './use-desktop-notifications';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useNotification = (userId) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showNotificationByType } = useDesktopNotifications();

  const messageBatchRef = useRef([]);
  const batchTimeoutRef = useRef(null);
  const stompClientRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const BATCH_DELAY = 100;

  const processBatch = useCallback(() => {
    if (messageBatchRef.current.length === 0) return;

    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];

    if (!isModalOpen) {
      updateNotificationsCache(batch);
      updateUnreadCount(batch.length);
      showDesktopNotifications(batch);
    }
  }, [queryClient, userId, showNotificationByType, isModalOpen]);

  const updateNotificationsCache = useCallback(
    (batch) => {
      queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
        if (!oldData) return oldData;

        const newPages = [...oldData.pages];

        batch.forEach((parsed) => {
          if (parsed.isRead === undefined) {
            parsed.isRead = false;
          }
          updateOrAddNotification(newPages, parsed);
        });

        return { ...oldData, pages: newPages };
      });
    },
    [queryClient, userId]
  );

  const updateOrAddNotification = useCallback((pages, notification) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const existingPageIndex = pages.findIndex((page) =>
      page.notifications?.some(
        (n) =>
          n.sender?.id === notification.sender?.id &&
          n.type === notification.type &&
          new Date(n.timestamp) > fiveMinutesAgo
      )
    );

    if (existingPageIndex !== -1) {
      const page = pages[existingPageIndex];
      const notificationIndex = page.notifications.findIndex(
        (n) =>
          n.sender?.id === notification.sender?.id &&
          n.type === notification.type &&
          new Date(n.timestamp) > fiveMinutesAgo
      );

      if (notificationIndex !== -1) {
        page.notifications[notificationIndex] = notification;
      }
    } else {
      if (pages[0]?.notifications) {
        pages[0].notifications.unshift(notification);
      }
    }
  }, []);

  const updateUnreadCount = useCallback(
    (batchSize) => {
      queryClient.setQueryData(
        [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
        (oldCount) => (oldCount || 0) + batchSize
      );
    },
    [queryClient, userId]
  );

  const showDesktopNotifications = useCallback(
    (batch) => {
      batch.forEach((notification) => showNotificationByType(notification));
    },
    [showNotificationByType]
  );

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
    queryFn: () => notificationsCommandApi.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useInfiniteQuery({
      queryKey: [QUERY_KEYS.NOTIFICATIONS, userId],
      queryFn: ({ pageParam = 0 }) => notificationsCommandApi.fetch(userId, pageParam),
      getNextPageParam: (lastPage) => {
        if (lastPage && lastPage.totalPages && lastPage.currentPage < lastPage.totalPages - 1) {
          return lastPage.currentPage + 1;
        }
        return undefined;
      },
      enabled: !!userId,
      refetchInterval: 15000,
    });

  const markAsRead = useMutation({
    mutationFn: ({ notificationId }) => notificationsCommandApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  const deleteNotification = useMutation({
    mutationFn: ({ notificationId }) => notificationsCommandApi.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
  });

  const markAllAsReadSilently = useCallback(async () => {
    try {
      await notificationsCommandApi.markAllAsRead(userId);

      queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          notifications:
            page.notifications?.map((notification) => ({
              ...notification,
              isRead: true,
            })) || [],
        }));

        return { ...oldData, pages: newPages };
      });

      queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId], 0);
    } catch (error) {
      console.error('Failed to mark all notifications as read silently:', error);
    }
  }, [queryClient, userId]);

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsCommandApi.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS, userId], (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          notifications:
            page.notifications?.map((notification) => ({
              ...notification,
              isRead: true,
            })) || [],
        }));

        return { ...oldData, pages: newPages };
      });

      queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId], 0);

      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, userId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId]);
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
    },
  });

  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        const parsed = JSON.parse(message.body);

        messageBatchRef.current.push(parsed);
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = setTimeout(processBatch, BATCH_DELAY);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    },
    [processBatch]
  );

  useEffect(() => {
    if (!userId) return;
    refetch();

    const setupWebSocket = async () => {
      try {
        const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
        if (!token) {
          console.warn('No authentication token found for notifications WebSocket');
          return;
        }

        let csrfToken = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/csrf`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            csrfToken = data.token;
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Failed to fetch CSRF token for notifications:', error.message);
          }
        }

        const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`, null, {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling'], // Exclude jsonp
        });
        
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            userId,
            token: `Bearer ${token}`,
            ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
          },
          reconnectDelay: 3000,
          heartbeatIncoming: 15000,
          heartbeatOutgoing: 15000,
          onConnect: () => {
            try {
              client.subscribe(`/user/${userId}/queue/notifications`, handleWebSocketMessage);
            } catch (error) {
              console.error('Failed to subscribe to notifications:', error);
            }
          },
          onStompError: (frame) => {},
          onWebSocketError: (event) => {},
          onWebSocketClose: (event) => {},
        });

        try {
          client.activate();
          stompClientRef.current = client;
        } catch (error) {
          console.error('Client activation failed:', error);
        }
      } catch (error) {
        console.error('WebSocket setup failed:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (stompClientRef.current) {
        try {
          stompClientRef.current.deactivate();
        } catch (error) {}
      }

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [userId, refetch, handleWebSocketMessage]);

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification) return;

      markAsRead({ notificationId: notification.id });

      switch (notification.type?.toLowerCase()) {
        case 'follow':
          if (notification.sender?.id) {
            router.push(`/profile/${notification.sender.id}`);
          }
          break;
        case 'like':
        case 'comment':
          let postId = null;

          if (notification.data?.postId) {
            postId = notification.data.postId;
          } else if (notification.link) {
            const match = notification.link.match(/\/posts\/([^\/]+)/);
            if (match) {
              postId = match[1];
            }
          } else if (notification.postId) {
            postId = notification.postId;
          }

          if (postId) {
            router.push(`/posts/${postId}`);
          }
          break;
        default:
          if (notification.link) {
            router.push(notification.link);
          }
          break;
      }
    },
    [markAsRead, router]
  );

  const notifications = data?.pages?.flatMap((page) => page?.notifications || []) || [];

  const setModalOpen = useCallback((open) => {
    setIsModalOpen(open);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadSilently,
    deleteNotification: deleteNotification.mutate,
    handleNotificationClick,
    fetchNextPage,
    refetch,
    setModalOpen,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotification.isPending,
  };
};
