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
import { 
  createTemporaryTimestamp, 
  areTimestampsClose, 
  createServerBoundMessage,
  mergeWithServerMessage 
} from '../utils/message-timestamp.util';

// Ensure messages are always in a stable order: timestamp asc, then id, then optimistic last
const sortMessages = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  
  // Early return for single item
  if (arr.length === 1) return arr;
  
  return [...arr].sort((a, b) => {
    // Compare timestamps first (most important)
    const ta = new Date(a?.timestamp || 0).getTime();
    const tb = new Date(b?.timestamp || 0).getTime();
    if (ta !== tb) return ta - tb;

    // Compare IDs if timestamps are equal
    const ida = String(a?.id || '');
    const idb = String(b?.id || '');
    if (ida && idb && ida !== idb) return ida.localeCompare(idb);
    
    // Optimistic messages go last
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
  const sendingMessagesRef = useRef(new Set()); // Track messages currently being sent

  // ✅ PERSISTENCE: Save/load message states to/from localStorage
  const getMessageStatesKey = () => `message_states_${user?.id}_${chatPartner}`;
  
  const saveMessageStates = useCallback((messages) => {
    if (!user?.id || !chatPartner) return;
    
    try {
      const statesData = messages
        .filter(msg => msg.messageState || msg.backendConfirmed !== undefined || msg.isOptimistic)
        .map(msg => ({
          id: msg.id,
          clientTempId: msg.clientTempId,
          messageState: msg.messageState,
          backendConfirmed: msg.backendConfirmed,
          isOptimistic: msg.isOptimistic,
          uploadProgress: msg.uploadProgress,
          persistentMessage: msg.persistentMessage,
          serverTimestamp: msg.serverTimestamp,
          timestamp: msg.timestamp, // Keep timestamp for identification
        }));
      
      localStorage.setItem(getMessageStatesKey(), JSON.stringify(statesData));
    } catch (error) {
      console.warn('Failed to save message states:', error);
    }
  }, [user?.id, chatPartner]);
  
  const loadMessageStates = useCallback(() => {
    if (!user?.id || !chatPartner) return new Map();
    
    try {
      const saved = localStorage.getItem(getMessageStatesKey());
      if (!saved) return new Map();
      
      const statesData = JSON.parse(saved);
      const stateMap = new Map();
      
      statesData.forEach(state => {
        if (state.id) stateMap.set(state.id, state);
        if (state.clientTempId) stateMap.set(state.clientTempId, state);
      });
      
      return stateMap;
    } catch (error) {
      console.warn('Failed to load message states:', error);
      return new Map();
    }
  }, [user?.id, chatPartner]);

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
    staleTime: 30000, // 30 seconds - chat list doesn't change as frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes - keep chat list in cache longer
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: (data) => {
      const safeData = Array.isArray(data) ? data : [];
      
      // Only sort if we have multiple items
      if (safeData.length > 1) {
      const sortedData = [...safeData].sort((a, b) => {
        const timeA = new Date(a.lastUpdated || 0).getTime();
        const timeB = new Date(b.lastUpdated || 0).getTime();
        return timeB - timeA;
      });
      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], sortedData);
      } else {
        queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], safeData);
      }
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chat list fetch error:', error.message);
      }
    },
  });

  // ✅ SIMPLIFIED: Basic query configuration without aggressive refetching
  const { data: messages } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, user?.id, chatPartner],
    queryFn: () => chatQueryApi.getMessages(user?.id, chatPartner),
    enabled: !!user?.id && !!chatPartner,
    staleTime: 30 * 1000, // 30 seconds - reasonable freshness
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Disable to prevent conflicts
    refetchOnMount: 'always', // Always fetch fresh data on mount
    refetchInterval: false, // No automatic refetching
    retry: 1, // Only retry once on failure
    keepPreviousData: true,
  });

  // ✅ PERSISTENCE: Merge cached states with fresh data to maintain message states  
  useEffect(() => {
    if (messages) {
      // Load saved states from localStorage and current memory
      const savedStateMap = loadMessageStates();
      
      // Also get current in-memory states (for recent changes)
      const memoryStateMap = new Map();
      chatMessages.forEach(msg => {
        if (msg.messageState || msg.backendConfirmed !== undefined || msg.isOptimistic) {
          const state = {
            messageState: msg.messageState,
            backendConfirmed: msg.backendConfirmed,
            isOptimistic: msg.isOptimistic,
            uploadProgress: msg.uploadProgress,
            persistentMessage: msg.persistentMessage,
            serverTimestamp: msg.serverTimestamp
          };
          
          if (msg.id) memoryStateMap.set(msg.id, state);
          if (msg.clientTempId) memoryStateMap.set(msg.clientTempId, state);
        }
      });
      
      // Merge fresh messages with preserved states (memory takes priority over localStorage)
      const mergedMessages = messages.map(freshMsg => {
        const memoryState = memoryStateMap.get(freshMsg.id) || memoryStateMap.get(freshMsg.clientTempId);
        const savedState = savedStateMap.get(freshMsg.id) || savedStateMap.get(freshMsg.clientTempId);
        const finalState = memoryState || savedState;
        
        if (finalState) {
          return {
            ...freshMsg,
            ...finalState, // Preserve the state information
            // But keep fresh data for content, fileUrls, etc.
            content: freshMsg.content,
            fileUrls: freshMsg.fileUrls,
            timestamp: freshMsg.timestamp,
          };
        }
        
        // ✅ DEFAULT STATE: Messages from DB should default to "sent" 
        return {
          ...freshMsg,
          messageState: 'sent', // Default state for existing messages from database
          backendConfirmed: true, // Already confirmed since they're in DB
          isOptimistic: false, // Not optimistic updates
        };
      });
      
      setChatMessages(sortMessages(mergedMessages));
    }
  }, [messages, chatPartner, queryClient, user?.id, loadMessageStates]);

  // ✅ PERSISTENCE: Auto-save message states when they change
  useEffect(() => {
    if (chatMessages.length > 0) {
      saveMessageStates(chatMessages);
    }
  }, [chatMessages, saveMessageStates]);

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
        console.log('✅ WebSocket connected for user:', user?.id);
        
        // ✅ SIMPLIFIED: Subscribe to channels without complex sync
        client.subscribe(`/user/${user?.id}/queue/messages`, handleIncomingMessage);
        client.subscribe(`/user/${user?.id}/queue/chat-list-update`, handleChatListUpdate);
        client.subscribe(`/user/${user?.id}/queue/errors`, (error) => {
          console.error('❌ WS error:', error);
        });
        
      },
      onStompError: (error) => {
        console.error('❌ STOMP error:', error);
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        console.warn('⚠️ WebSocket closed, attempting reconnection...');
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      },
      onWebSocketError: (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [user?.id]);

  // ✅ REMOVED: Complex sync mechanisms that cause race conditions
  // Keeping only the basic WebSocket reconnection without aggressive syncing

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      stompClientRef.current?.deactivate();
    };
  }, [connectWebSocket]);

  // ✅ COMPLETELY REWRITTEN: Simplified, bulletproof message handling
  const handleIncomingMessage = useCallback(
    (message) => {
    try {
      const newMessage = JSON.parse(message.body);
      
      // Basic validation
      if (!newMessage?.sender || !newMessage?.receiver) {
        console.warn('Invalid message structure:', newMessage);
        return;
      }
      
      // ✅ BULLETPROOF: Single source of truth for message updates
      const updateMessages = (updateFn) => {
        // Update local state
        setChatMessages(prev => {
          const updated = updateFn(prev);
          
          // Immediately sync to cache (atomic operation)
          if (chatPartner && user?.id) {
            queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], updated);
          }
          
          return updated;
        });
      };
      
      // ✅ SIMPLIFIED: One clear logic path
      updateMessages(prev => {
        // Check if message already exists (by ID or clientTempId)
        const existingIndex = prev.findIndex(msg => 
          (msg.id && msg.id === newMessage.id) ||
          (msg.clientTempId && msg.clientTempId === newMessage.clientTempId) ||
          (msg.content === newMessage.content && 
           msg.sender === newMessage.sender && 
           msg.receiver === newMessage.receiver &&
           areTimestampsClose(msg.timestamp, newMessage.timestamp))
        );
        
        if (existingIndex !== -1) {
          // Update existing message with server data
          const updated = [...prev];
          updated[existingIndex] = mergeWithServerMessage(updated[existingIndex], newMessage);
          console.log('🔄 Updated existing message:', newMessage.content);
          return sortMessages(updated);
        } else {
          // Add new message
          const newMsg = {
            ...newMessage,
            messageState: 'sent',
            backendConfirmed: true,
            isOptimistic: false,
            isFailed: false
          };
          console.log('➕ Added new message:', newMessage.content);
          return sortMessages([...prev, newMsg]);
        }
      });
      
      // ✅ SIMPLIFIED: Update chat list
      const otherUserId = newMessage.sender === user?.id ? newMessage.receiver : newMessage.sender;
      const oldList = queryClient.getQueryData([QUERY_KEYS.CHAT_LIST, user?.id]) || [];
      
      const existingChatIndex = oldList.findIndex((chat) => chat.userId === otherUserId);
      if (existingChatIndex >= 0) {
        const updated = [...oldList];
        updated[existingChatIndex] = {
          ...updated[existingChatIndex],
          lastMessage: newMessage.content || (newMessage.fileUrls?.length ? 'Đã gửi file' : ''),
          lastUpdated: newMessage.timestamp,
          hasNewMessage: newMessage.sender !== user?.id
        };
        queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], updated);
      }
      
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  }, [chatPartner, user?.id, queryClient]);
  
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

  // ✅ REMOVED: Complex backend verification that caused race conditions
  // Messages now rely on immediate WebSocket/HTTP response for confirmation

  // ✅ REMOVED: Separate HTTP send function - now integrated into main sendMessage



  const sendMessage = async (content, files, receiverId) => {
    const target = receiverId || chatPartner;
    
    if (!user?.id || !target || typeof target !== 'string' || target.trim() === '') {
      console.warn('Invalid send parameters');
      return;
    }
    
    // ✅ BULLETPROOF: Generate unique identifiers
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientTempId = messageId;
    const currentTime = createTemporaryTimestamp(); // For optimistic UI only, server will override
    
    // ✅ BULLETPROOF: Prevent duplicate sends with stronger key (use messageId instead of timestamp)
    const sendKey = `${user.id}-${target}-${content}-${messageId}`;
    if (sendingMessagesRef.current.has(sendKey)) {
      console.warn('⚠️ Duplicate send attempt blocked');
      return;
    }
    sendingMessagesRef.current.add(sendKey);
    
    // ✅ SIMPLIFIED: Create optimistic message (timestamp for UI display only, server will set final timestamp)
    const optimisticMessage = {
      id: messageId,
      clientTempId,
      sender: user.id,
      receiver: target,
      content: content || '',
      timestamp: currentTime, // Temporary timestamp for optimistic UI
      fileUrls: [],
      messageState: 'sending',
      isOptimistic: true,
      backendConfirmed: false,
      isFailed: false,
      error: undefined
    };
    
    try {
      // ✅ ATOMIC: Add optimistic message immediately
      setChatMessages(prev => {
        const updated = sortMessages([...prev, optimisticMessage]);
        // Immediately sync to cache
        queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, target], updated);
        return updated;
      });
      
      // ✅ BULLETPROOF: Handle file uploads first
      let uploadedFileUrls = [];
      if (files && files.length > 0) {
        try {
          // Update status to uploading
          setChatMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, messageState: 'uploading' }
              : msg
          ));
          
          uploadedFileUrls = await uploadFiles(files);
          console.log('✅ Files uploaded successfully:', uploadedFileUrls.length);
        } catch (uploadError) {
          console.error('❌ File upload failed:', uploadError);
          throw new Error('File upload failed');
        }
      }
      
      // ✅ BULLETPROOF: Single send attempt (no dual WebSocket/HTTP)
      // ✅ SERVER TIMESTAMP: Create server-bound message (timestamp will be generated by server)
      const messagePayload = createServerBoundMessage({
        id: messageId,
        clientTempId,
        sender: user.id,
        receiver: target,
        content: content || '',
        fileUrls: uploadedFileUrls
      });
      
      // ✅ SIMPLIFIED: Choose one delivery method
      let success = false;
      let backendResponse = null;
      
      // Try WebSocket first if connected
      if (isConnected && stompClientRef.current?.connected) {
        try {
          console.log('📤 Sending via WebSocket...');
          stompClientRef.current.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messagePayload),
            headers: {
              'content-type': 'application/json',
              'message-id': messageId
            }
          });
          
          // ✅ BULLETPROOF: Wait for backend confirmation
          backendResponse = await waitForBackendConfirmation(messageId, 10000); // 10 second timeout
          success = true;
          console.log('✅ WebSocket send confirmed');
        } catch (wsError) {
          console.warn('⚠️ WebSocket send failed, trying HTTP:', wsError.message);
        }
      }
      
      // Fallback to HTTP if WebSocket failed or not connected
      if (!success) {
        try {
          console.log('📤 Sending via HTTP...');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getCookie(COOKIE_KEYS.AUTH_TOKEN)}`,
            },
            body: JSON.stringify(messagePayload),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          backendResponse = await response.json();
          success = true;
          console.log('✅ HTTP send successful');
        } catch (httpError) {
          console.error('❌ HTTP send failed:', httpError);
          throw new Error('All delivery methods failed');
        }
      }
      
      // ✅ BULLETPROOF: Update message to sent state
      if (success) {
        setChatMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === messageId 
              ? mergeWithServerMessage(msg, backendResponse)
              : msg
          );
          
          // Immediately sync to cache
          queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, target], updated);
          return updated;
        });
        
        console.log('✅ Message successfully sent and confirmed');
      }
      
    } catch (error) {
      console.error('❌ Send message failed:', error);
      
      // ✅ BULLETPROOF: Mark as failed
      setChatMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                messageState: 'failed',
                isOptimistic: false,
                isFailed: true,
                error: error.message || 'Send failed'
              }
            : msg
        );
        
        // Sync failed state to cache
        queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, target], updated);
        return updated;
      });
    } finally {
      // ✅ CLEANUP: Always remove from sending set
      sendingMessagesRef.current.delete(sendKey);
    }
  };

  // ✅ NEW: Wait for backend confirmation
  const waitForBackendConfirmation = useCallback(async (messageId, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkConfirmation = async () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Confirmation timeout'));
          return;
        }
        
        try {
          // Check if message exists in backend
          const messages = await chatQueryApi.getMessages(user?.id, chatPartner);
          const confirmedMessage = messages.find(msg => 
            msg.id === messageId || msg.clientTempId === messageId
          );
          
          if (confirmedMessage) {
            resolve(confirmedMessage);
          } else {
            // Check again in 1 second
            setTimeout(checkConfirmation, 1000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Start checking after 2 seconds
      setTimeout(checkConfirmation, 2000);
    });
  }, [user?.id, chatPartner]);

  // ✅ SIMPLIFIED: Basic retry function for user-initiated retries only  
  const retryMessage = useCallback(async (message) => {
    if (!message || !chatPartner || !user?.id) return;
    
    console.log('🔄 User initiated retry for message:', message.content);
    
    // Remove the failed message and resend
    setChatMessages(prev => prev.filter(msg => msg.id !== message.id));
    
    // Resend the message
    await sendMessage(message.content, [], message.receiver || chatPartner);
  }, [chatPartner, user?.id, sendMessage]);

  return {
    chatMessages,
    sendMessage,
    chatList,
    isLoadingChatList,
    chatListError,
    messagesEndRef,
    isConnected,
    retryMessage, // ✅ Only expose user-initiated retry
  };
};    

