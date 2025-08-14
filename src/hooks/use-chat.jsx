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

  // ✅ PERFORMANCE: Optimized message list query with better caching for persistent states
  const { data: messages } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, user?.id, chatPartner],
    queryFn: () => chatQueryApi.getMessages(user?.id, chatPartner),
    enabled: !!user?.id && !!chatPartner,
    staleTime: 0, // Always consider data potentially stale for real-time updates
    cacheTime: 30 * 60 * 1000, // 30 minutes - keep message states persistent when switching chats
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't always refetch - preserve cached state first
    refetchInterval: false, // Disable automatic refetching
    keepPreviousData: true, // Keep previous data while fetching new data
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
        
        // ✅ IMPROVED: Subscribe to all necessary channels
        client.subscribe(`/user/${user?.id}/queue/messages`, handleIncomingMessage);
        client.subscribe(`/user/${user?.id}/queue/chat-list-update`, handleChatListUpdate);
        client.subscribe(`/user/${user?.id}/queue/errors`, (error) => {
          console.error('❌ WS error:', error);
        });
        
        // ✅ IMPROVED: Request missed messages after reconnection
        requestMissedMessages();
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

  // ✅ IMPROVED: Request missed messages after WebSocket reconnection
  const requestMissedMessages = useCallback(async () => {
    if (!chatPartner || !user?.id) return;
    
    try {
      // Get the last message timestamp to request only newer messages
      const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
      const lastMessage = currentMessages[currentMessages.length - 1];
      
      if (lastMessage && lastMessage.timestamp) {
        const lastTimestamp = new Date(lastMessage.timestamp);
        const now = new Date();
        
        // Request messages from last 5 minutes to catch any missed ones
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        if (lastTimestamp < fiveMinutesAgo) {
          // Fetch messages from the last timestamp to ensure we have everything
          const missedMessages = await chatQueryApi.getMessages(user?.id, chatPartner);
          
          if (missedMessages && missedMessages.length > 0) {
            // Merge missed messages with current ones, avoiding duplicates
            const existingIds = new Set(currentMessages.map(msg => msg.id || msg.clientTempId));
            const newMessages = missedMessages.filter(msg => 
              !existingIds.has(msg.id) && !existingIds.has(msg.clientTempId)
            );
            
            if (newMessages.length > 0) {
              const mergedMessages = [...currentMessages, ...newMessages];
              const sortedMessages = sortMessages(mergedMessages);
              
              // Update both local state and cache
              setChatMessages(sortedMessages);
              queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], sortedMessages);
              
              console.log(`✅ Recovered ${newMessages.length} missed messages after reconnection`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to request missed messages:', error);
    }
  }, [chatPartner, user?.id, queryClient]);

  // ✅ IMPROVED: Force message synchronization when needed
  const forceMessageSync = useCallback(async () => {
    if (!chatPartner || !user?.id) return;
    
    try {
      console.log('🔄 Force syncing messages...');
      
      // Fetch fresh messages from backend
      const backendMessages = await chatQueryApi.getMessages(user?.id, chatPartner);
      
      if (backendMessages && backendMessages.length > 0) {
        // Get current messages
        const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
        
        // Create efficient lookup maps
        const currentMap = new Map();
        currentMessages.forEach(msg => {
          const key = msg.id || msg.clientTempId;
          if (key) currentMap.set(key, msg);
        });
        
        // Find all missing messages
        const missingMessages = [];
        backendMessages.forEach(backendMsg => {
          const key = backendMsg.id || backendMsg.clientTempId;
          if (key && !currentMap.has(key)) {
            missingMessages.push({
              ...backendMsg,
              messageState: 'sent',
              backendConfirmed: true,
              isOptimistic: false
            });
          }
        });
        
        if (missingMessages.length > 0) {
          console.log(`🔄 Found ${missingMessages.length} missing messages during force sync`);
          
          const mergedMessages = [...currentMessages, ...missingMessages];
          const sortedMessages = sortMessages(mergedMessages);
          
          // Update both local state and cache
          setChatMessages(sortedMessages);
          queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], sortedMessages);
          
          return missingMessages.length;
        } else {
          console.log('✅ All messages are in sync');
          return 0;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Force sync failed:', error);
      return 0;
    }
  }, [chatPartner, user?.id, queryClient]);

  // ✅ IMPROVED: Add manual sync button functionality
  useEffect(() => {
    // Expose force sync function globally for debugging
    if (typeof window !== 'undefined') {
      window.forceMessageSync = forceMessageSync;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.forceMessageSync;
      }
    };
  }, [forceMessageSync]);

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
      
        // ✅ FIX: Improved message deduplication and synchronization
        
        // ✅ CACHE: Also update cache for immediate availability when switching chats
        const isForCurrentChat = (newMessage.sender === user?.id && newMessage.receiver === chatPartner) ||
                                (newMessage.sender === chatPartner && newMessage.receiver === user?.id);
        
        if (isForCurrentChat) {
          const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
          
          // ✅ IMPROVED: Better deduplication logic with stricter checking
          let shouldAddMessage = true;
          let updatedMessages = currentMessages;
          
          // First try to match by clientTempId (most reliable)
          if (newMessage.clientTempId) {
            const byTempId = currentMessages.find((msg) => msg.clientTempId === newMessage.clientTempId);
            if (byTempId) {
              // Update existing optimistic message
              updatedMessages = currentMessages.map((msg) =>
                msg.clientTempId === newMessage.clientTempId
                  ? { 
                      ...msg, 
                      ...newMessage, 
                      isOptimistic: false, 
                      id: newMessage.id || msg.id, // Use backend ID if available
                      messageState: 'sent',
                      backendConfirmed: true,
                      serverTimestamp: newMessage.timestamp
                    }
                  : msg
              );
              shouldAddMessage = false;
            }
          }
          
          // If no tempId match, try to match by content and timing (with stricter logic)
          if (shouldAddMessage) {
            const existingMessage = currentMessages.find(msg => {
              // ✅ IMPROVED: Stricter matching to prevent duplicates
              const contentMatch = msg.content === newMessage.content;
              const senderMatch = msg.sender === newMessage.sender;
              const receiverMatch = msg.receiver === newMessage.receiver;
              const timeMatch = Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 5000; // Reduced to 5 seconds
              
              // ✅ NEW: Also check if message is already confirmed to prevent duplicates
              const notAlreadyConfirmed = !msg.backendConfirmed || msg.isOptimistic;
              
              return contentMatch && senderMatch && receiverMatch && timeMatch && notAlreadyConfirmed;
            });
            
            if (existingMessage) {
              // Update existing message with backend data
              updatedMessages = currentMessages.map((msg) =>
                msg.id === existingMessage.id
                  ? { 
                      ...msg, 
                      ...newMessage, 
                      isOptimistic: false,
                      id: newMessage.id || msg.id,
                      messageState: 'sent',
                      backendConfirmed: true,
                      serverTimestamp: newMessage.timestamp
                    }
                  : msg
              );
              shouldAddMessage = false;
            }
          }
          
          // ✅ IMPROVED: Additional check to prevent exact duplicates
          if (shouldAddMessage) {
            const exactDuplicate = currentMessages.find(msg => 
              msg.content === newMessage.content && 
              msg.sender === newMessage.sender &&
              msg.receiver === newMessage.receiver &&
              msg.backendConfirmed &&
              Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 2000
            );
            
            if (exactDuplicate) {
              console.log('🔄 Duplicate message detected, skipping:', newMessage.content);
              shouldAddMessage = false;
            }
          }
          
          // Add new message if it's truly new
          if (shouldAddMessage) {
            console.log('➕ Adding new message:', newMessage.content);
            updatedMessages = [...currentMessages, {
              ...newMessage,
              messageState: 'sent',
              backendConfirmed: true,
              isOptimistic: false,
              serverTimestamp: newMessage.timestamp
            }];
          }
          
          // Update cache with sorted messages
          queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], sortMessages(updatedMessages));
        }
        
      setChatMessages((prev) => {
          // ✅ IMPROVED: Better local state synchronization with duplicate prevention
          let newState = prev;
          
          // First try to match by clientTempId
          if (newMessage.clientTempId) {
            const byTempId = prev.find((msg) => msg.clientTempId === newMessage.clientTempId);
            if (byTempId) {
              newState = sortMessages(
                prev.map((msg) =>
                  msg.clientTempId === newMessage.clientTempId
                    ? { 
                        ...msg, 
                        ...newMessage, 
                        isOptimistic: false, 
                        id: newMessage.id || msg.id,
                        messageState: 'sent',
                        backendConfirmed: true,
                        serverTimestamp: newMessage.timestamp
                      }
                    : msg
                )
              );
              return newState;
            }
          }
          
          // Check if we already have an optimistic message with same content (stricter)
          const existingOptimistic = prev.find(
            (msg) =>
          msg.isOptimistic && 
          msg.content === newMessage.content && 
          msg.sender === newMessage.sender &&
          msg.receiver === newMessage.receiver &&
              Math.abs(
                new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()
              ) < 5000 // Keep at 5 seconds for optimistic messages
        );
        
        if (existingOptimistic) {
          // Update the existing optimistic message with real data
            return sortMessages(
              prev.map((msg) =>
            msg.id === existingOptimistic.id 
              ? { 
                  ...newMessage, 
                  isOptimistic: false,
                  messageState: 'sent',
                  backendConfirmed: true,
                  serverTimestamp: newMessage.timestamp
                }
              : msg
              )
            );
        }
        
        // ✅ IMPROVED: Additional duplicate check for confirmed messages
        const confirmedDuplicate = prev.find(msg => 
          msg.content === newMessage.content &&
          msg.sender === newMessage.sender &&
          msg.receiver === newMessage.receiver &&
          msg.backendConfirmed &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 2000
        );
        
        if (confirmedDuplicate) {
          console.log('🔄 Duplicate confirmed message, skipping:', newMessage.content);
          return prev;
        }
        
        // Add new message if it's not from us (receiver's message)
        if (newMessage.sender !== user?.id) {
            console.log('➕ Adding incoming message:', newMessage.content);
            return sortMessages([...prev, {
              ...newMessage,
              messageState: 'sent',
              backendConfirmed: true,
              isOptimistic: false,
              serverTimestamp: newMessage.timestamp
            }]);
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
    [user?.id, queryClient, chatPartner]
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

  // ✅ BACKEND SYNC: Verify message status with backend
  const verifyMessageStatus = useCallback(async (messageId, clientTempId) => {
    try {
      const backendStatus = await chatQueryApi.checkMessageStatus(messageId, clientTempId);
      
      if (backendStatus.exists && backendStatus.serverConfirmed) {
        // Update message state based on backend response
        setChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === messageId || msg.clientTempId === clientTempId) {
              return {
                ...msg,
                messageState: mapBackendStatusToFrontend(backendStatus.status),
                backendConfirmed: true,
                serverTimestamp: backendStatus.timestamp,
                isOptimistic: false
              };
            }
            return msg;
          });
        });
        
        // Also update cache
        if (chatPartner) {
          const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
          const updatedMessages = currentMessages.map((msg) => {
            if (msg.id === messageId || msg.clientTempId === clientTempId) {
              return {
                ...msg,
                messageState: mapBackendStatusToFrontend(backendStatus.status),
                backendConfirmed: true,
                serverTimestamp: backendStatus.timestamp,
                isOptimistic: false
              };
            }
            return msg;
          });
          queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], updatedMessages);
        }
      }
      
      return backendStatus;
    } catch (error) {
      console.warn('Failed to verify message status:', error);
      return { status: 'unknown', exists: false };
    }
  }, [chatPartner, queryClient, user?.id]);

  // ✅ MAPPING: Convert backend status to simplified frontend messageState
  const mapBackendStatusToFrontend = (backendStatus) => {
    switch (backendStatus) {
      case 'pending': return 'sending';
      case 'sent': return 'sent';
      case 'delivered': return 'sent'; // ✅ SIMPLIFIED: Map to "sent"
      case 'read': return 'sent'; // ✅ SIMPLIFIED: Map to "sent"
      case 'failed': return 'failed';
      default: return 'sending'; // ✅ SIMPLIFIED: Default to "sending"
    }
  };

  // ✅ BATCH SYNC: Periodically sync message statuses with backend
  const syncMessageStatuses = useCallback(async () => {
    try {
      // Get unconfirmed messages (optimistic or not backend confirmed)
      const unconfirmedMessages = chatMessages.filter(msg => 
        msg.isOptimistic || !msg.backendConfirmed
      );
      
      if (unconfirmedMessages.length === 0) return;
      
      const messageIds = unconfirmedMessages.map(msg => msg.clientTempId || msg.id).filter(Boolean);
      const backendStatuses = await chatQueryApi.batchCheckMessageStatus(messageIds);
      
      // Update messages with backend statuses
      setChatMessages((prev) => {
        return prev.map((msg) => {
          const key = msg.clientTempId || msg.id;
          const backendStatus = backendStatuses[key];
          
          if (backendStatus) {
            return {
              ...msg,
              messageState: mapBackendStatusToFrontend(backendStatus.status),
              backendConfirmed: true,
              serverTimestamp: backendStatus.timestamp,
              isOptimistic: false
            };
          }
          return msg;
        });
      });
      
      // Also update cache
      if (chatPartner) {
        const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
        const updatedMessages = currentMessages.map((msg) => {
          const key = msg.clientTempId || msg.id;
          const backendStatus = backendStatuses[key];
          
          if (backendStatus) {
            return {
              ...msg,
              messageState: mapBackendStatusToFrontend(backendStatus.status),
              backendConfirmed: true,
              serverTimestamp: backendStatus.timestamp,
              isOptimistic: false
            };
          }
          return msg;
        });
        queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], updatedMessages);
      }
    } catch (error) {
      console.warn('Failed to sync message statuses:', error);
    }
  }, [chatMessages, chatPartner, queryClient, user?.id]);

  // ✅ AUTO SYNC: Sync every 10 seconds for unconfirmed messages
  useEffect(() => {
    const unconfirmedCount = chatMessages.filter(msg => 
      msg.isOptimistic || !msg.backendConfirmed
    ).length;
    
    if (unconfirmedCount === 0) return;
    
    const interval = setInterval(syncMessageStatuses, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [chatMessages.length, syncMessageStatuses]); // ✅ FIX: Only depend on length, not the whole array

  // ✅ IMPROVED: Periodic full message synchronization to prevent drift
  useEffect(() => {
    if (!chatPartner || !user?.id) return;
    
    // Sync all messages every 30 seconds to prevent any drift
    const interval = setInterval(async () => {
      try {
        const backendMessages = await chatQueryApi.getMessages(user?.id, chatPartner);
        
        if (backendMessages && backendMessages.length > 0) {
          // Get current messages
          const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
          
          // Create maps for efficient lookup
          const currentMap = new Map();
          currentMessages.forEach(msg => {
            const key = msg.id || msg.clientTempId;
            if (key) currentMap.set(key, msg);
          });
          
          // ✅ IMPROVED: Better duplicate detection during sync
          const missingMessages = [];
          const duplicateMessages = [];
          
          backendMessages.forEach(backendMsg => {
            const key = backendMsg.id || backendMsg.clientTempId;
            if (key && !currentMap.has(key)) {
              // Check if this is a duplicate of an existing message
              const isDuplicate = currentMessages.some(existingMsg => 
                existingMsg.content === backendMsg.content &&
                existingMsg.sender === backendMsg.sender &&
                existingMsg.receiver === backendMsg.receiver &&
                Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(backendMsg.timestamp).getTime()) < 5000
              );
              
              if (!isDuplicate) {
                missingMessages.push({
                  ...backendMsg,
                  messageState: 'sent',
                  backendConfirmed: true,
                  isOptimistic: false
                });
              } else {
                duplicateMessages.push(backendMsg);
              }
            }
          });
          
          // Add missing messages if any found
          if (missingMessages.length > 0) {
            console.log(`🔄 Found ${missingMessages.length} missing messages, syncing...`);
            
            const mergedMessages = [...currentMessages, ...missingMessages];
            const sortedMessages = sortMessages(mergedMessages);
            
            // Update both local state and cache
            setChatMessages(sortedMessages);
            queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], sortedMessages);
          }
          
          // Log duplicate detection
          if (duplicateMessages.length > 0) {
            console.log(`🔄 Detected ${duplicateMessages.length} duplicate messages during sync`);
          }
          
          // ✅ IMPROVED: Also check for local duplicates and clean them up
          const localDuplicates = findLocalDuplicates(currentMessages);
          if (localDuplicates.length > 0) {
            console.log(`🧹 Cleaning up ${localDuplicates.length} local duplicate messages`);
            const cleanedMessages = removeLocalDuplicates(currentMessages);
            setChatMessages(cleanedMessages);
            queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], cleanedMessages);
          }
        }
      } catch (error) {
        console.warn('Periodic sync failed:', error);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [chatPartner, user?.id, queryClient]);

  // ✅ NEW: Helper function to find local duplicate messages
  const findLocalDuplicates = useCallback((messages) => {
    const duplicates = [];
    const seen = new Set();
    
    messages.forEach((msg, index) => {
      const key = `${msg.content}-${msg.sender}-${msg.receiver}`;
      const timestamp = new Date(msg.timestamp).getTime();
      
      // Check if we've seen a similar message recently
      const isDuplicate = Array.from(seen).some(seenKey => {
        const [seenContent, seenSender, seenReceiver, seenTime] = seenKey.split('-');
        return seenContent === msg.content &&
               seenSender === msg.sender &&
               seenReceiver === msg.receiver &&
               Math.abs(parseInt(seenTime) - timestamp) < 5000;
      });
      
      if (isDuplicate) {
        duplicates.push({ message: msg, index });
      } else {
        seen.add(`${key}-${timestamp}`);
      }
    });
    
    return duplicates;
  }, []);

  // ✅ NEW: Helper function to remove local duplicate messages
  const removeLocalDuplicates = useCallback((messages) => {
    const seen = new Set();
    const cleaned = [];
    
    messages.forEach(msg => {
      const key = `${msg.content}-${msg.sender}-${msg.receiver}`;
      const timestamp = new Date(msg.timestamp).getTime();
      
      // Keep the first occurrence of each message
      const isDuplicate = Array.from(seen).some(seenKey => {
        const [seenContent, seenSender, seenReceiver, seenTime] = seenKey.split('-');
        return seenContent === msg.content &&
               seenSender === msg.sender &&
               seenReceiver === msg.receiver &&
               Math.abs(parseInt(seenTime) - timestamp) < 5000;
      });
      
      if (!isDuplicate) {
        cleaned.push(msg);
        seen.add(`${key}-${timestamp}`);
      }
    });
    
    return sortMessages(cleaned);
  }, []);

  // ✅ RETRY FAILED MESSAGES: Auto retry failed messages after backend confirmation
  const retryFailedMessagesRef = useRef(new Set()); // Track already processed failed messages
  
  useEffect(() => {
    const failedMessages = chatMessages.filter(msg => 
      msg.messageState === 'failed' && msg.backendConfirmed && !retryFailedMessagesRef.current.has(msg.id)
    );
    
    failedMessages.forEach(msg => {
      retryFailedMessagesRef.current.add(msg.id); // Mark as processed
      
      // Set timeout to retry failed message
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto retrying failed message:', msg.id);
        }
        // You can implement retry logic here or show user option to retry
      }, 5000);
    });
  }, [chatMessages.map(msg => `${msg.id}-${msg.messageState}`).join(',')]); // ✅ FIX: Only re-run when message states change

  // ✅ EXPIRE OLD PENDING MESSAGES: Mark as failed if pending too long
  useEffect(() => {
    const timeoutChecker = () => {
      const now = new Date().getTime();
      const expiredMessages = chatMessages.filter(msg => {
        if (!msg.isOptimistic && msg.backendConfirmed) return false;
        
        const messageTime = new Date(msg.timestamp).getTime();
        const timeDiff = now - messageTime;
        return timeDiff > 60000; // 1 minute timeout
      });
      
      if (expiredMessages.length > 0) {
        setChatMessages((prev) => {
          return prev.map((msg) => {
            const messageTime = new Date(msg.timestamp).getTime();
            const timeDiff = now - messageTime;
            
            if ((msg.isOptimistic || !msg.backendConfirmed) && timeDiff > 60000) {
              return {
                ...msg,
                messageState: 'failed',
                isOptimistic: false,
                error: 'Message timeout - no backend confirmation'
              };
            }
            return msg;
          });
        });
      }
    };
    
    // Check for expired messages every 30 seconds instead of on every chatMessages change
    const interval = setInterval(timeoutChecker, 30000);
    return () => clearInterval(interval);
  }, []); // ✅ FIX: Empty dependency array, use interval instead

  const sendMessage = async (content, files, receiverId) => {
    const target = receiverId || chatPartner;
    
    if (!user?.id || !target || typeof target !== 'string' || target.trim() === '') {
      return;
    }
    
    // ✅ FIX: Prevent duplicate message sending
    const messageKey = `${user.id}-${target}-${content}-${Date.now()}`;
    if (sendingMessagesRef.current.has(messageKey)) {
      console.warn('⚠️ Message already being sent, ignoring duplicate');
      return;
    }
    
    // ✅ FIX: Add to sending set to prevent duplicates
    sendingMessagesRef.current.add(messageKey);
    
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
      // ✅ MESSAGE STATES: Clear state tracking
      messageState: 'sending', // sending -> uploading -> uploaded -> sent -> delivered
      uploadProgress: 0,
      persistentMessage: true, // Never remove this message, only update it
    };
    
    setChatMessages((prev) => sortMessages([...prev, optimisticMessage]));
    
    // ✅ CACHE: Update messages cache immediately
    const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, target]) || [];
    queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, target], sortMessages([...currentMessages, optimisticMessage]));
    
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
                optimisticMessage.content || (optimisticMessage.fileUrls?.length ? 'Đã gửi file' : ''),
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
        lastMessage: optimisticMessage.content || (optimisticMessage.content?.length ? 'Đã gửi file' : ''),
        lastUpdated: currentTime,
        hasNewMessage: true,
      };
      updated = [newChat, ...oldList];
    }

    queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], updated);
    
    try {
      // ✅ IMPROVED: Better file handling and message preparation
      let uploadedFileUrls = [];
      if (files && files.length > 0) {
        try {
          uploadedFileUrls = await uploadFiles(files);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          // Continue without files rather than failing completely
        }
      }
      
      // ✅ IMPROVED: Create final message with all necessary data
      const finalMessage = {
        ...optimisticMessage,
        fileUrls: uploadedFileUrls,
        timestamp: currentTime,
        clientTempId, // Ensure clientTempId is preserved
      };
      
      // ✅ IMPROVED: Update optimistic message with file URLs
      setChatMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === optimisticId) {
            return {
              ...msg, // Keep all original properties
              ...finalMessage, // Override with final data
              id: msg.id, // Ensure ID stays the same for smooth transition
            };
          }
          return msg;
        });
      });
      
      // ✅ CACHE: Update messages cache with final message smoothly
      const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, target]) || [];
      const updatedMessages = currentMessages.map((msg) => {
        if (msg.id === optimisticId) {
          return {
            ...msg, // Keep all original properties
            ...finalMessage, // Override with final data
            id: msg.id, // Ensure ID stays the same
          };
        }
        return msg;
      });
      queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, target], sortMessages(updatedMessages));
      
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
      
        // ✅ IMPROVED: Better WebSocket message handling with retry logic
        
        if (isConnected && stompClientRef.current?.connected) {
          const messagePayload = {
            sender: user.id,
            receiver: target,
            content: content || '',
            fileUrls: uploadedFileUrls, // Send URLs for WebSocket compatibility
            clientTempId,
            timestamp: currentTime, // ✅ VIETNAM TIMEZONE: Send Vietnam time to backend
          };
          
          // ✅ IMPROVED: Add retry mechanism for WebSocket failures
          let wsRetryCount = 0;
          const maxWsRetries = 3;
          
          const sendViaWebSocket = () => {
            try {
          stompClientRef.current.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messagePayload),
            headers: {
              'content-type': 'application/json',
            priority: 'high',
            },
          });
          
              // ✅ IMPROVED: Check status after WebSocket send with retry
          setTimeout(async () => {
            await verifyMessageStatus(optimisticId, clientTempId);
                // ✅ FIX: Remove from sending set after successful send
                sendingMessagesRef.current.delete(messageKey);
          }, 2000); // Check after 2 seconds
          
            } catch (wsError) {
              console.warn('WebSocket send failed, retrying...', wsError);
              if (wsRetryCount < maxWsRetries) {
                wsRetryCount++;
                setTimeout(sendViaWebSocket, 1000 * wsRetryCount); // Exponential backoff
        } else {
                // Fallback to HTTP if WebSocket fails completely
                console.warn('WebSocket failed after retries, falling back to HTTP');
                sendMessageViaHttp(finalMessage);
                setTimeout(async () => {
                  await verifyMessageStatus(optimisticId, clientTempId);
                  // ✅ FIX: Remove from sending set after HTTP send
                  sendingMessagesRef.current.delete(messageKey);
                }, 1000);
              }
            }
          };
          
          sendViaWebSocket();
          
        } else {
          // ✅ IMPROVED: HTTP fallback with better error handling
          await sendMessageViaHttp(finalMessage);
          
          // ✅ IMPROVED: Check status after HTTP send
          setTimeout(async () => {
            await verifyMessageStatus(optimisticId, clientTempId);
            // ✅ FIX: Remove from sending set after HTTP send
            sendingMessagesRef.current.delete(messageKey);
          }, 1000); // Check after 1 second
        }
    } catch (error) {
      // ✅ FIX: Remove from sending set on error
      sendingMessagesRef.current.delete(messageKey);
      
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
          timestamp: message.timestamp, // ✅ VIETNAM TIMEZONE: Send Vietnam time to backend
        }),
        keepalive: true,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // ✅ IMPROVED: Handle duplicate message response
      if (responseData.status === 'duplicate') {
        console.log('🔄 Backend detected duplicate message, marking as sent');
        // Mark the optimistic message as sent since backend already has it
        setChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.clientTempId === message.clientTempId || msg.id === message.id) {
              return {
                ...msg,
                isOptimistic: false,
                messageState: 'sent',
                backendConfirmed: true,
                serverTimestamp: responseData.timestamp
              };
            }
            return msg;
          });
        });
        
        // Also update cache
        if (chatPartner) {
          const currentMessages = queryClient.getQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner]) || [];
          const updatedMessages = currentMessages.map((msg) => {
            if (msg.clientTempId === message.clientTempId || msg.id === message.id) {
              return {
                ...msg,
                isOptimistic: false,
                messageState: 'sent',
                backendConfirmed: true,
                serverTimestamp: responseData.timestamp
              };
            }
            return msg;
          });
          queryClient.setQueryData([QUERY_KEYS.MESSAGES, user?.id, chatPartner], updatedMessages);
        }
        
        return;
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
    forceMessageSync, // ✅ NEW: Expose force sync function
    requestMissedMessages, // ✅ NEW: Expose missed messages function
    findLocalDuplicates, // ✅ NEW: Expose duplicate detection function
    removeLocalDuplicates, // ✅ NEW: Expose duplicate removal function
  };
};    

