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

  // ✅ PERFORMANCE: Optimized chat list query with better caching
  const { data: chatList, isLoading: isLoadingChatList } = useQuery({
    queryKey: [QUERY_KEYS.CHAT_LIST, user?.id],
    queryFn: () => chatQueryApi.getChatList(user?.id),
    enabled: !!user?.id,
    keepPreviousData: true,
    staleTime: 30000, // 30 seconds - reduce unnecessary refetches
    cacheTime: 300000, // 5 minutes - keep in cache longer
    onSuccess: (data) => {
      const sortedData = [...data].sort((a, b) => {
        const timeA = new Date(a.lastUpdated || 0).getTime();
        const timeB = new Date(b.lastUpdated || 0).getTime();
        return timeB - timeA; // Descending order (newest first)
      });
      
      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], sortedData);
      
      // Only log critical errors in development
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
      setChatMessages(messages);
    }
  }, [messages]);

  // WebSocket
  const connectWebSocket = useCallback(async () => {
    if (!user?.id) return;

    // Fetch CSRF token for WebSocket connection
    let csrfToken = null;
    try {
      const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
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
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token for chat:', error);
    }

    const socket = new SockJS(
      `${process.env.NEXT_PUBLIC_API_URL}/ws?token=${getCookie(COOKIE_KEYS.AUTH_TOKEN)}`,
      null,
      {
        transports: ['websocket'], // ✅ PERFORMANCE: WebSocket only for better performance
        timeout: 5000, // ✅ PERFORMANCE: Ultra-fast timeout
        heartbeat: 8000, // ✅ PERFORMANCE: Faster heartbeat for real-time chat
      }
    );
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
      },
      // ✅ PERFORMANCE: Ultra-fast heartbeat for real-time chat
      heartbeatIncoming: 8000,
      heartbeatOutgoing: 8000,
      // ✅ PERFORMANCE: Optimized for speed
      reconnectDelay: 1000, // Faster reconnection
      maxWebSocketFrameSize: 32 * 1024, // Larger frame size for faster data transfer
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        client.subscribe(`/user/${user?.id}/queue/messages`, handleIncomingMessage);
        client.subscribe(`/user/${user?.id}/queue/chat-list-update`, handleChatListUpdate);
        client.subscribe(`/user/${user?.id}/queue/errors`, (error) =>
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
      
      // Validate incoming message structure
      if (!newMessage || typeof newMessage !== 'object') {
        console.error('Invalid message format received:', newMessage);
        return;
      }
      
      // Ensure required fields are present and valid
      if (!newMessage.sender || !newMessage.receiver || typeof newMessage.sender !== 'string' || typeof newMessage.receiver !== 'string') {
        console.error('Invalid message sender/receiver:', newMessage);
        return;
      }
      
      // ✅ FIX: Update existing optimistic message or add new message
      setChatMessages((prev) => {
        // Check if we already have an optimistic message with same content
        const existingOptimistic = prev.find(msg => 
          msg.isOptimistic && 
          msg.content === newMessage.content && 
          msg.sender === newMessage.sender &&
          msg.receiver === newMessage.receiver &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 5000
        );
        
        if (existingOptimistic) {
          // Update the existing optimistic message with real data
          return prev.map(msg => 
            msg.id === existingOptimistic.id 
              ? { ...newMessage, isOptimistic: false }
              : msg
          ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        
        // Add new message if it's not from us (receiver's message)
        if (newMessage.sender !== user?.id) {
          return [...prev, newMessage]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        
        // Don't add duplicate messages from sender
        return prev;
      });
      
      updateChatListCache(newMessage);
    } catch (error) {
      console.error('❌ handleIncomingMessage error:', error);
    }
  }, []);

  const updateChatListCache = useCallback(
    (newMessage) => {
      const otherUserId = newMessage?.sender === user?.id ? newMessage?.receiver : newMessage?.sender;
      const oldList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];
      
      // ✅ FIX: Check if chat already exists
      const existingChatIndex = oldList.findIndex(chat => chat.userId === otherUserId);
      
      let updated;
      if (existingChatIndex >= 0) {
        // ✅ FIX: Update existing chat
        updated = oldList.map((chat, index) =>
          index === existingChatIndex
            ? {
                ...chat,
                lastMessage: newMessage.content || (newMessage.fileUrls?.length ? 'Đã gửi file' : ''),
                lastUpdated: newMessage.timestamp,
              }
            : chat
        );
      } else {
        // ✅ FIX: Add new chat if it doesn't exist
        const newChat = {
          userId: otherUserId,
          fullname: 'Unknown User', // Will be updated by backend
          username: 'unknown',
          avatar: '',
          lastMessage: newMessage.content || (newMessage.fileUrls?.length ? 'Đã gửi file' : ''),
          lastUpdated: newMessage.timestamp,
        };
        updated = [...oldList, newChat];
      }

      // ✅ FIX: Sort by latest message time (newest first)
      const sorted = updated.sort((a, b) => {
        const timeA = new Date(a.lastUpdated || 0).getTime();
        const timeB = new Date(b.lastUpdated || 0).getTime();
        return timeB - timeA; // Descending order (newest first)
      });

      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], sorted);
      
      // Silent update - only log errors
    },
    [queryClient, user?.id]
  );
  
  // ✅ REAL-TIME: Handle chat list updates from WebSocket
  const handleChatListUpdate = useCallback((message) => {
    try {
      const updatedChatList = JSON.parse(message.body);
      // ✅ FIX: Sort the updated chat list by latest message time
      const sortedChatList = [...updatedChatList].sort((a, b) => {
        const timeA = new Date(a.lastUpdated || 0).getTime();
        const timeB = new Date(b.lastUpdated || 0).getTime();
        return timeB - timeA; // Descending order (newest first)
      });
      
      // Update React Query cache with sorted chat list
      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], sortedChatList);
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error parsing chat list update:', error);
      }
    }
  }, [queryClient, user?.id]);



  const sendMessage = async (content, files, receiverId) => {
    // ✅ PERFORMANCE: Fast validation without console logs in production
    const target = receiverId || chatPartner;
    
    if (!user?.id || !target || typeof target !== 'string' || target.trim() === '') {
      // Silent validation - only log critical errors
      return;
    }
    
    // ✅ OPTIMISTIC: Create message with optimistic ID
    const optimisticId = `optimistic_${Date.now()}_${Math.random()}`;
    const optimisticMessage = {
      id: optimisticId,
      sender: user.id,
      receiver: target,
      content: content || '',
      timestamp: new Date().toISOString(),
      fileUrls: [],
      isOptimistic: true, // Flag to identify optimistic messages
    };
    
    // ✅ OPTIMISTIC: Add message to UI immediately
    setChatMessages(prev => [...prev, optimisticMessage]);
    
    // ✅ OPTIMISTIC: Update chat list immediately
    updateChatListCache(optimisticMessage);
    
    // ✅ OPTIMISTIC: Scroll to bottom immediately
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    try {
      // ✅ OPTIMISTIC: Upload files in background
      const uploadedFileUrls = files?.length ? await uploadFiles(files) : [];
      
      // ✅ OPTIMISTIC: Create final message with uploaded files
      const finalMessage = {
        ...optimisticMessage,
        fileUrls: uploadedFileUrls,
        isOptimistic: false,
      };
      
      // ✅ OPTIMISTIC: Update message with real data (no backend response needed)
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId ? finalMessage : msg
        )
      );
      
      // ✅ OPTIMISTIC: Update chat list with final message
      updateChatListCache(finalMessage);
      
              // ✅ PERFORMANCE: Ultra-fast message sending
        if (isConnected && stompClientRef.current?.connected) {
          // ✅ PERFORMANCE: Optimized message payload
          const messagePayload = {
            sender: user.id,
            receiver: target,
            content: content || '',
            timestamp: finalMessage.timestamp,
            fileUrls: uploadedFileUrls,
          };
          
          // ✅ PERFORMANCE: Send with optimized headers
          stompClientRef.current.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messagePayload),
            headers: {
              'content-type': 'application/json',
              'priority': 'high', // High priority for chat messages
            },
          });
          
                // Silent success - only log errors
          
          // ✅ PERFORMANCE: Message already updated in UI, no need for backend response
          
        } else {
          // ✅ PERFORMANCE: Fast HTTP fallback
          await sendMessageViaHttp(finalMessage);
        }
      
    } catch (error) {
      // ✅ OPTIMISTIC: Handle error - mark message as failed
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, isFailed: true, error: error.message }
            : msg
        )
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to send message:', error);
      }
      
      // Show error toast
      // addToast({
      //   title: 'Error',
      //   description: 'Failed to send message. Please try again.',
      //   timeout: 3000,
      //   color: 'danger',
      // });
    }
  };
  
  // ✅ PERFORMANCE: Ultra-fast HTTP fallback with connection pooling
  const sendMessageViaHttp = async (message) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie(COOKIE_KEYS.AUTH_TOKEN)}`,
          'Connection': 'keep-alive', // ✅ PERFORMANCE: Keep connection alive
          'Keep-Alive': 'timeout=5, max=1000', // ✅ PERFORMANCE: Connection pooling
        },
        body: JSON.stringify(message),
        // ✅ PERFORMANCE: Optimized fetch options
        keepalive: true, // Keep connection alive for faster subsequent requests
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Message sent via HTTP successfully');
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
    messagesEndRef,
    isConnected,
  };
};
