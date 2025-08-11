import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { uploadFiles } from '../utils/upload-files.util';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { chatQueryApi } from '../apis/chat/query/chat.query.api';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { getVietnamTimeISO } from '../utils/timezone.util';
import { getCsrfTokenSafe } from '../utils/csrf.util';

// Ensure messages are always in a stable order: timestamp asc, then id, then optimistic last
const sortMessages = (arr) => {
  return [...(Array.isArray(arr) ? arr : [])].sort((a, b) => {
    const ta = new Date(a?.timestamp || 0).getTime();
    const tb = new Date(b?.timestamp || 0).getTime();

    if (ta !== tb) return ta - tb;

    const ida = String(a?.id || '');
    const idb = String(b?.id || '');

    if (ida && idb && ida !== idb) return ida.localeCompare(idb);
    if (a?.isOptimistic && !b?.isOptimistic) return 1;
    if (!a?.isOptimistic && b?.isOptimistic) return -1;
    
    return 0;
  });
};

export const useChat = (user, chatPartner) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ✅ PERFORMANCE: Optimized chat list query with better caching
  const {
    data: chatList,
    isLoading: isLoadingChatList,
    error: chatListError,
  } = useQuery({
    queryKey: [QUERY_KEYS.CHAT_LIST, user?.id],
    queryFn: () => chatQueryApi.getChatList(user?.id),
    enabled: !!user?.id,
    keepPreviousData: true,
    staleTime: 10000,
    cacheTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: (data) => {
      const safeData = Array.isArray(data) ? data : [];
      const sortedData = [...safeData].sort((a, b) => {
        const timeA = new Date(a.lastUpdated || 0).getTime();
        const timeB = new Date(b.lastUpdated || 0).getTime();
        return timeB - timeA;
      });

      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], sortedData);
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chat list fetch error:', error.message);
      }
    },
  });

  // ✅ PERFORMANCE: Optimized message list query with better caching
  const { data: messages } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, user?.id, chatPartner],
    queryFn: () => chatQueryApi.getMessages(user?.id, chatPartner),
    enabled: !!user?.id && !!chatPartner,
    staleTime: 10000, // 10 seconds - messages change frequently
    cacheTime: 60000, // 1 minute - keep messages in cache
  });

  useEffect(() => {
    if (messages) {
      setChatMessages(sortMessages(messages));
    }
  }, [messages]);

  // WebSocket
  const connectWebSocket = useCallback(async () => {
    if (!user?.id) return;

    // Fetch CSRF token for WebSocket connection with caching and timeout
    const jwt = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    const csrfToken = await getCsrfTokenSafe(process.env.NEXT_PUBLIC_API_URL, jwt, {
      ttlMs: 10 * 60 * 1000,
    });

    const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`);
    const authToken = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        token: authToken ? `Bearer ${authToken}` : undefined,
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
      },
      heartbeatIncoming: 8000,
      heartbeatOutgoing: 8000,
      reconnectDelay: 1000,
      maxWebSocketFrameSize: 32 * 1024,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/user/${user?.id}/queue/messages`, handleIncomingMessage);
        client.subscribe(`/user/${user?.id}/queue/chat-list-update`, handleChatListUpdate);
        client.subscribe(`/user/${user?.id}/queue/errors`, (error) => {
          console.error('❌ WS error:', error);
        });
      },
      onStompError: () => setIsConnected(false),
      onWebSocketClose: () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      },
      onWebSocketError: () => setIsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;
  }, [user?.id]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      stompClientRef.current?.deactivate();
    };
  }, [connectWebSocket]);

  // Handle incoming real-time messages from WebSocket
  const handleIncomingMessage = useCallback(
    (message) => {
      try {
        const newMessage = JSON.parse(message.body);

        // Validate incoming message structure
        if (!newMessage || typeof newMessage !== 'object') {
          return;
        }

        // Ensure required fields are present and valid
        if (
          !newMessage.sender ||
          !newMessage.receiver ||
          typeof newMessage.sender !== 'string' ||
          typeof newMessage.receiver !== 'string'
        ) {
          return;
        }

        // ✅ FIX: Update existing optimistic message or add new message. Prefer matching by clientTempId.
        setChatMessages((prev) => {
          if (newMessage.clientTempId) {
            const byTempId = prev.find((msg) => msg.clientTempId === newMessage.clientTempId);
            if (byTempId) {
              return sortMessages(
                prev.map((msg) =>
                  msg.clientTempId === newMessage.clientTempId
                    ? { ...newMessage, isOptimistic: false }
                    : msg
                )
              );
            }
          }
          // Check if we already have an optimistic message with same content
          const existingOptimistic = prev.find(
            (msg) =>
              msg.isOptimistic &&
              msg.content === newMessage.content &&
              msg.sender === newMessage.sender &&
              msg.receiver === newMessage.receiver &&
              Math.abs(
                new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()
              ) < 5000
          );

          if (existingOptimistic) {
            // Update the existing optimistic message with real data
            return sortMessages(
              prev.map((msg) =>
                msg.id === existingOptimistic.id
                  ? { ...newMessage, isOptimistic: false }
                  : msg
              )
            );
          }

          // Add new message if it's not from us (receiver's message)
          if (newMessage.sender !== user?.id) {
            return sortMessages([...prev, newMessage]);
          }

          // Don't add duplicate messages from sender
          return prev;
        });

        // ✅ FIX: Update chat list immediately for incoming messages
        const otherUserId =
          newMessage?.sender === user?.id ? newMessage?.receiver : newMessage?.sender;
        const oldList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];

        const existingChatIndex = oldList.findIndex((chat) => chat.userId === otherUserId);

        let updated;
        if (existingChatIndex >= 0) {
          updated = oldList.map((chat, index) =>
            index === existingChatIndex
              ? {
                  ...chat,
                  lastMessage:
                    newMessage.content || (newMessage.fileUrls?.length ? 'Đã gửi file' : ''),
                  lastUpdated: newMessage.timestamp || new Date().toISOString(),
                  hasNewMessage: true,
                }
              : chat
          );

          if (existingChatIndex > 0) {
            const chatToMove = updated[existingChatIndex];
            updated.splice(existingChatIndex, 1);
            updated.unshift(chatToMove);
          }
        } else {
          const newChat = {
            userId: otherUserId,
            fullname: 'Unknown User',
            username: 'unknown',
            avatar: '',
            lastMessage: newMessage.content || (newMessage.fileUrls?.length ? 'Đã gửi file' : ''),
            lastUpdated: newMessage.timestamp || new Date().toISOString(),
            hasNewMessage: true,
          };
          updated = [newChat, ...oldList];
        }

        queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], updated);
      } catch (error) {
        // Silent error handling
      }
    },
    [user?.id, queryClient]
  );

  // ✅ REAL-TIME: Handle chat list updates from WebSocket
  const handleChatListUpdate = useCallback(
    (message) => {
      try {
        const updateData = JSON.parse(message.body);

        // ✅ FIX: Handle notification instead of full chat list
        if (updateData.type === 'chat-list-update') {
          return;
        }

        if (Array.isArray(updateData)) {
          const currentList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];

          const currentChatMap = new Map();
          currentList.forEach((chat) => {
            currentChatMap.set(chat.userId, {
              lastMessage: chat.lastMessage,
              lastUpdated: chat.lastUpdated,
              hasNewMessage: chat.hasNewMessage,
            });
          });

          const mergedList = updateData.map((backendChat) => {
            const currentChat = currentChatMap.get(backendChat.userId);

            if (currentChat) {
              const optimisticTime = new Date(currentChat.lastUpdated).getTime();
              const now = new Date().getTime();
              const isRecentOptimistic = currentChat.hasNewMessage && now - optimisticTime < 5000;

              if (isRecentOptimistic) {
                return {
                  ...backendChat,
                  lastMessage: currentChat.lastMessage,
                  lastUpdated: currentChat.lastUpdated,
                  hasNewMessage: currentChat.hasNewMessage,
                };
              } else {
                const backendTime = new Date(backendChat.lastMessageTime || 0).getTime();
                const currentTime = new Date(currentChat.lastUpdated || 0).getTime();

                return {
                  ...backendChat,
                  lastMessage: backendChat.lastMessage || currentChat.lastMessage,
                  lastUpdated:
                    backendTime > currentTime
                      ? new Date(backendChat.lastMessageTime).toISOString()
                      : currentChat.lastUpdated,
                  hasNewMessage: false,
                };
              }
            } else {
              return {
                ...backendChat,
                lastUpdated: backendChat.lastMessageTime
                  ? new Date(backendChat.lastMessageTime).toISOString()
                  : new Date().toISOString(),
              };
            }
          });

          queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], mergedList);
        }
      } catch (error) {
        // Silent error handling
      }
    },
    [queryClient, user?.id]
  );

  const sendMessage = async (content, files, receiverId) => {
    const target = receiverId || chatPartner;

    if (!user?.id || !target || typeof target !== 'string' || target.trim() === '') {
      return;
    }

    const optimisticId = `optimistic_${Date.now()}_${Math.random()}`;
    const clientTempId = optimisticId;
    const currentTime = getVietnamTimeISO();
    const optimisticMessage = {
      id: optimisticId,
      sender: user.id,
      receiver: target,
      content: content || '',
      // let server set authoritative timestamp; keep local for UI continuity only
      timestamp: currentTime,
      fileUrls: [],
      isOptimistic: true,
      clientTempId,
    };

    setChatMessages((prev) => sortMessages([...prev, optimisticMessage]));

    const otherUserId = optimisticMessage.receiver;
    const oldList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];

    const existingChatIndex = oldList.findIndex((chat) => chat.userId === otherUserId);

    let updated;
    if (existingChatIndex >= 0) {
      updated = oldList.map((chat, index) =>
        index === existingChatIndex
          ? {
              ...chat,
              lastMessage:
                optimisticMessage.content ||
                (optimisticMessage.fileUrls?.length ? 'Đã gửi file' : ''),
              lastUpdated: currentTime,
              hasNewMessage: true,
            }
          : chat
      );

      if (existingChatIndex > 0) {
        const chatToMove = updated[existingChatIndex];
        updated.splice(existingChatIndex, 1);
        updated.unshift(chatToMove);
      }
    } else {
      const newChat = {
        userId: otherUserId,
        fullname: 'Unknown User',
        username: 'unknown',
        avatar: '',
        lastMessage:
          optimisticMessage.content || (optimisticMessage.fileUrls?.length ? 'Đã gửi file' : ''),
        lastUpdated: currentTime,
        hasNewMessage: true,
      };
      updated = [newChat, ...oldList];
    }

    queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], updated);

    setTimeout(() => {
      const currentList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];
      const cleanedList = currentList.map((chat) => {
        if (chat.userId === otherUserId && chat.hasNewMessage) {
          return { ...chat, hasNewMessage: false };
        }
        return chat;
      });
      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], cleanedList);
    }, 3000);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const uploadedFileUrls = files?.length ? await uploadFiles(files) : [];

      const finalMessage = {
        ...optimisticMessage,
        fileUrls: uploadedFileUrls,
        isOptimistic: false,
      };

      setChatMessages((prev) =>
        sortMessages(prev.map((msg) => (msg.id === optimisticId ? finalMessage : msg)))
      );

      const otherUserId = finalMessage.receiver;
      const oldList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];

      const existingChatIndex = oldList.findIndex((chat) => chat.userId === otherUserId);

      if (existingChatIndex >= 0) {
        const updated = oldList.map((chat, index) =>
          index === existingChatIndex
            ? {
                ...chat,
                lastMessage:
                  finalMessage.content || (finalMessage.fileUrls?.length ? 'Đã gửi file' : ''),
                lastUpdated: currentTime,
                hasNewMessage: true,
              }
            : chat
        );

        queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], updated);
      }

      if (isConnected && stompClientRef.current?.connected) {
        const messagePayload = {
          sender: user.id,
          receiver: target,
          content: content || '',
          fileUrls: uploadedFileUrls,
          clientTempId,
        };

        stompClientRef.current.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(messagePayload),
          headers: {
            'content-type': 'application/json',
            priority: 'high',
          },
        });
      } else {
        await sendMessageViaHttp(finalMessage);
      }
    } catch (error) {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticId ? { ...msg, isFailed: true, error: error.message } : msg
        )
      );

      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to send message:', error);
      }
    }
  };

  // ✅ PERFORMANCE: Ultra-fast HTTP fallback with connection pooling
  const sendMessageViaHttp = async (message) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie(COOKIE_KEYS.AUTH_TOKEN)}`,
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=5, max=1000',
        },
        body: JSON.stringify({
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          fileUrls: message.fileUrls,
          clientTempId: message.clientTempId || message.id,
        }),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`HTTP send failed: ${error.message}`);
    }
  };

  return {
    chatMessages,
    sendMessage,
    chatList,
    isLoadingChatList,
    chatListError,
    messagesEndRef,
    isConnected,
  };
};
