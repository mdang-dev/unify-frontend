'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsCommandApi } from '../apis/notifications/command/notifications.command.api';
import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
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
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [webSocketError, setWebSocketError] = useState(null);
  const BATCH_DELAY = 100;

  // Get initial unread count only once, no polling
  const { data: unreadCount = 0 } = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
    queryFn: () => notificationsCommandApi.getUnreadCount(userId),
    enabled: !!userId && !isWebSocketConnected, // Only fetch if WebSocket is not connected
    staleTime: Infinity, // Don't refetch automatically
    refetchInterval: !isWebSocketConnected ? 30000 : false, // Fallback to polling if WebSocket fails
  });

  // Get initial notifications only once, no polling
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
      enabled: !!userId && !isWebSocketConnected, // Only fetch if WebSocket is not connected
      staleTime: Infinity, // Don't refetch automatically
      refetchInterval: !isWebSocketConnected ? 30000 : false, // Fallback to polling if WebSocket fails
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

  // Define updateOrAddNotification first since it's used by updateNotificationsCache
  const updateOrAddNotification = useCallback((pages, notification) => {
    try {
      if (!Array.isArray(pages) || !notification) return;
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const existingPageIndex = pages.findIndex((page) =>
        page?.notifications?.some(
          (n) =>
            n?.sender?.id === notification?.sender?.id &&
            n?.type === notification?.type &&
            new Date(n?.timestamp || 0) > fiveMinutesAgo
        )
      );

      if (existingPageIndex !== -1) {
        const page = pages[existingPageIndex];
        if (page?.notifications) {
          const notificationIndex = page.notifications.findIndex(
            (n) =>
              n?.sender?.id === notification?.sender?.id &&
              n?.type === notification?.type &&
              new Date(n?.timestamp || 0) > fiveMinutesAgo
          );

          if (notificationIndex !== -1) {
            page.notifications[notificationIndex] = notification;
          }
        }
      } else {
        if (pages[0]?.notifications) {
          pages[0].notifications.unshift(notification);
        }
      }
    } catch (error) {
      console.error('Failed to update or add notification:', error);
    }
  }, []);

  // Define updateNotificationsCache after updateOrAddNotification
  const updateNotificationsCache = useCallback(
    (batch) => {
      try {
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
      } catch (error) {
        console.error('Failed to update notifications cache:', error);
      }
    },
    [queryClient, userId, updateOrAddNotification]
  );

  // Define updateUnreadCount
  const updateUnreadCount = useCallback(
    (batchSize) => {
      try {
        queryClient.setQueryData(
          [QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT, userId],
          (oldCount) => (oldCount || 0) + batchSize
        );
      } catch (error) {
        console.error('Failed to update unread count:', error);
      }
    },
    [queryClient, userId]
  );

  // Define showDesktopNotifications
  const showDesktopNotifications = useCallback(
    (batch) => {
      batch.forEach((notification) => showNotificationByType(notification));
    },
    [showNotificationByType]
  );

  // Now define processBatch after all its dependencies
  const processBatch = useCallback(() => {
    try {
      if (messageBatchRef.current.length === 0) return;

      const batch = [...messageBatchRef.current];
      messageBatchRef.current = [];

      if (!isModalOpen) {
        updateNotificationsCache(batch);
        updateUnreadCount(batch.length);
        showDesktopNotifications(batch);
      }
    } catch (error) {
      console.error('Failed to process notification batch:', error);
    }
  }, [isModalOpen, updateNotificationsCache, updateUnreadCount, showDesktopNotifications]);

  // Define handleWebSocketMessage after processBatch
  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        if (!message || !message.body) {
          return;
        }

        const parsed = JSON.parse(message.body);
        
        // Validate the parsed message
        if (!parsed || typeof parsed !== 'object') {
          return;
        }

        messageBatchRef.current.push(parsed);
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = setTimeout(processBatch, BATCH_DELAY);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    },
    [processBatch]
  );

  // Define setupWebSocket after handleWebSocketMessage and all other dependencies
  const setupWebSocket = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
      if (!token) {
        setWebSocketError('Authentication token missing');
        return;
      }

      // Validate API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setWebSocketError('API URL not configured');
        return;
      }

      // Test API connectivity first
      try {
        const testResponse = await fetch(`${apiUrl}/actuator/health`, { 
          method: 'GET',
          timeout: 5000 
        });
        if (!testResponse.ok) {
          setWebSocketError('Backend service unavailable');
          return;
        }
      } catch (error) {
        setWebSocketError('Cannot reach backend service');
        return;
      }

      // Clean up existing connection
      if (stompClientRef.current) {
        try {
          stompClientRef.current.deactivate();
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Create WebSocket connection with token in query parameter for better compatibility
      const wsUrl = `${apiUrl}/ws?token=${encodeURIComponent(token)}`;
      
      // Try different transport methods with fallback
      const transportMethods = [
        ['websocket'],
        ['xhr-streaming'],
        ['xhr-polling'],
        ['websocket', 'xhr-streaming', 'xhr-polling']
      ];

      let socket = null;
      let connectionSuccess = false;

      for (const transports of transportMethods) {
        try {
          socket = new SockJS(wsUrl, null, {
            transports: transports,
            timeout: 10000,
          });

          // Add SockJS event listeners for better error handling
          socket.onopen = () => {
            connectionSuccess = true;
          };

          socket.onclose = (event) => {
            // Connection closed
          };

          socket.onerror = (error) => {
            // Connection error
          };

          // Wait a bit to see if connection succeeds
          await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(), 2000);
            socket.onopen = () => {
              clearTimeout(timeout);
              connectionSuccess = true;
              resolve();
            };
            socket.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
          });

          if (connectionSuccess) {
            break;
          } else {
            socket.close();
          }
        } catch (error) {
          if (socket) {
            socket.close();
          }
        }
      }

      if (!connectionSuccess) {
        setWebSocketError('All WebSocket transport methods failed');
        return;
      }
      
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          userId,
          token: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 20000,
        heartbeatOutgoing: 20000,
        onConnect: () => {
          try {
            client.subscribe(`/user/${userId}/queue/notifications`, handleWebSocketMessage);
            setIsWebSocketConnected(true);
            setWebSocketError(null);
            
            // Once WebSocket is connected, fetch initial data if not already loaded
            const currentData = queryClient.getQueryData([QUERY_KEYS.NOTIFICATIONS, userId]);
            if (!currentData || !currentData.pages || currentData.pages.length === 0) {
              refetch();
            }
          } catch (error) {
            setWebSocketError('Failed to subscribe to notifications');
          }
        },
        onStompError: (frame) => {
          setWebSocketError(`STOMP connection error: ${frame.headers?.message || 'Unknown STOMP error'}`);
          setIsWebSocketConnected(false);
        },
        onWebSocketError: (event) => {
          setWebSocketError(`WebSocket connection error: ${event.type || 'Unknown error'}`);
          setIsWebSocketConnected(false);
        },
        onWebSocketClose: (event) => {
          setIsWebSocketConnected(false);
          setWebSocketError(`WebSocket connection closed: ${event.reason || 'Unknown reason'} (Code: ${event.code})`);
        },
        onDisconnect: () => {
          setIsWebSocketConnected(false);
          setWebSocketError('WebSocket disconnected');
        },
      });

      try {
        client.activate();
        stompClientRef.current = client;
      } catch (error) {
        setWebSocketError('Failed to activate WebSocket client');
      }
    } catch (error) {
      setWebSocketError('Failed to setup WebSocket connection');
    }
  }, [userId, handleWebSocketMessage, queryClient, refetch]);

  useEffect(() => {
    if (!userId) return;
    
    // Setup WebSocket connection
    setupWebSocket();

    return () => {
      if (stompClientRef.current) {
        try {
          stompClientRef.current.deactivate();
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [userId, setupWebSocket]);

  // Reconnect WebSocket if connection is lost
  useEffect(() => {
    if (!isWebSocketConnected && userId && !webSocketError) {
      const reconnectTimer = setTimeout(() => {
        setupWebSocket();
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [isWebSocketConnected, userId, webSocketError, setupWebSocket]);

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
    try {
      setIsModalOpen(open);
    } catch (error) {
      console.error('Error setting modal open state:', error);
    }
  }, []);

  // Safe access to data properties
  const safeData = useMemo(() => {
    try {
      if (!data || !Array.isArray(data.pages)) {
        return { pages: [], totalElements: 0, totalPages: 0, currentPage: 0 };
      }
      return data;
    } catch (error) {
      console.error('Error processing notification data:', error);
      return { pages: [], totalElements: 0, totalPages: 0, currentPage: 0 };
    }
  }, [data]);

  return {
    notifications,
    unreadCount: unreadCount || 0,
    isLoading: isLoading || false,
    error,
    hasNextPage: hasNextPage || false,
    isFetchingNextPage: isFetchingNextPage || false,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadSilently,
    deleteNotification: deleteNotification.mutate,
    handleNotificationClick,
    fetchNextPage,
    refetch,
    setModalOpen,
    isMarkingAsRead: markAsRead.isPending || false,
    isMarkingAllAsRead: markAllAsReadMutation.isPending || false,
    isDeleting: deleteNotification.isPending || false,
    // WebSocket status
    isWebSocketConnected,
    webSocketError,
    // Safe data access
    safeData,
  };
};
