import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { uploadFiles } from '../utils/upload-files.util';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { chatQueryApi } from '../apis/chat/query/chat.query.api';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

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

  // Chat list query
  const { data: chatList, isLoading: isLoadingChatList } = useQuery({
    queryKey: [QUERY_KEYS.CHAT_LIST, user?.id],
    queryFn: () => chatQueryApi.getChatList(user.id),
    enabled: !!user?.id,
    keepPreviousData: true,
    onSuccess: (data) => {
      queryClient.setQueryData(
        [QUERY_KEYS.CHAT_LIST, user.id],
        [...data].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      );
    },
  });

  // Message list query
  const { data: messages } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, user?.id, chatPartner],
    queryFn: () => chatQueryApi.getMessages(user.id, chatPartner),
    enabled: !!user?.id && !!chatPartner,
  });

  useEffect(() => {
    if (messages) {
      setChatMessages(messages);
    }
  }, [messages]);

  // WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    const socket = new SockJS(
      `${process.env.NEXT_PUBLIC_API_URL}/ws?token=${getCookie(COOKIE_KEYS.AUTH_TOKEN)}`
    );
    const client = new Client({
      webSocketFactory: () => socket,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        client.subscribe(`/user/${user.id}/queue/messages`, handleIncomingMessage);
        client.subscribe(`/user/${user.id}/queue/errors`, (error) =>
          console.error('❌ WS error:', error)
        );
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

  // Incoming message
  const handleIncomingMessage = useCallback((message) => {
    try {
      const newMessage = JSON.parse(message.body);
      setChatMessages((prev) =>
        [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      );
      updateChatListCache(newMessage);
    } catch (error) {
      console.error('❌ handleIncomingMessage error:', error);
    }
  }, []);

  const updateChatListCache = useCallback(
    (newMessage) => {
      const otherUserId = newMessage.sender === user.id ? newMessage.receiver : newMessage.sender;
      const oldList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user.id]) || [];
      const updated = oldList.map((chat) =>
        chat.userId === otherUserId
          ? {
              ...chat,
              lastMessage: newMessage.content || 'Đã gửi file',
              lastUpdated: newMessage.timestamp,
            }
          : chat
      );

      queryClient.setQueryData(
        [QUERY_KEYS.CHAT_LIST, user.id],
        updated.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      );
    },
    [queryClient, user?.id]
  );

  const sendMessage = async (content, files) => {
    if (!isConnected || !stompClientRef.current?.connected) return;

    const fileUrls = files?.length ? await uploadFiles(files) : [];

    const message = {
      sender: user.id,
      receiver: chatPartner,
      content: content || '',
      timestamp: new Date().toISOString(),
      fileUrls,
    };

    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message),
    });

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return {
    chatMessages,
    sendMessage,
    chatList,
    isLoadingChatList,
    messagesEndRef,
    isConnected,
  };
};
