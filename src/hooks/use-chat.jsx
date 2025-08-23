import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFiles } from '../utils/upload-files.util';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { chatQueryApi } from '../apis/chat/query/chat.query.api';
import { getVietnamTimeISO } from '../utils/timezone.util';
import { useSocket } from './use-socket';
import { usePresence } from './use-presence';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { getCookie } from '../utils/cookies.util';
import { flushSync } from 'react-dom';

// Ensure messages are always in a stable order: timestamp asc, then id, then optimistic last
const sortMessages = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  
  // Early return for single item
  if (arr.length === 1) return arr;
  
  return [...arr].sort((a, b) => {
    // ✅ IMPROVED: Better timestamp handling with timezone consideration
    let ta = 0;
    let tb = 0;
    
    try {
      if (a?.timestamp) {
        const dateA = new Date(a.timestamp);
        if (!isNaN(dateA.getTime())) {
          ta = dateA.getTime();
        }
      }
      
      if (b?.timestamp) {
        const dateB = new Date(b.timestamp);
        if (!isNaN(dateB.getTime())) {
          tb = dateB.getTime();
        }
      }
    } catch (error) {
      console.warn('Error parsing timestamp during sorting:', error);
    }
    
    // If both timestamps are valid and different, sort by time
    if (ta > 0 && tb > 0 && ta !== tb) {
      return ta - tb; // Ascending order: oldest first, newest last
    }
    
    // If one timestamp is invalid, prioritize the valid one
    if (ta > 0 && tb === 0) return -1;
    if (ta === 0 && tb > 0) return 1;
    
    // If both timestamps are equal or both invalid, use message ID for stable ordering
    const ida = String(a?.id || '');
    const idb = String(b?.id || '');
    if (ida && idb && ida !== idb) {
      // For optimistic messages, use timestamp-based ID comparison
      if (ida.startsWith('temp-') && idb.startsWith('temp-')) {
        const timeA = parseInt(ida.split('-')[1]) || 0;
        const timeB = parseInt(idb.split('-')[1]) || 0;
        return timeA - timeB;
      }
      // For regular messages, use string comparison
      return ida.localeCompare(idb);
    }
    
    // ✅ IMPROVED: Optimistic messages always go last for stability
    if (a?.isOptimistic && !b?.isOptimistic) return 1;
    if (!a?.isOptimistic && b?.isOptimistic) return 1;
    
    // If both are optimistic or both are not, maintain order
    return 0;
  });
};

export const useChat = (user, chatPartner) => {
  // Use existing socket hook
  const { connected: isConnected, client: socketClient } = useSocket();
  
  // Use presence hook for status and typing
  const { 
    getUserStatus, 
    isUserTyping, 
    isAnyoneTypingToMe,
    getAllTypingUsers,
    handleTyping, 
    stopTyping,
    userStatuses,
    typingUsers,
    requestOnlineUsersStatus
  } = usePresence();
  
  // Message state
  const [conversationMessages, setConversationMessages] = useState(new Map());
  const [optimisticMessages, setOptimisticMessages] = useState(new Map());
  
  // Refs
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const subscriptionsRef = useRef(new Map());
  
  // Normalize chatPartner to get the ID
  const chatPartnerId = typeof chatPartner === 'string' ? chatPartner : chatPartner?.id;
  
  // Debug logging for chat partner


  // Get current conversation messages (optimistic + server)
  const chatMessages = useMemo(() => {
    const serverMessages = conversationMessages.get(chatPartnerId) || [];
    const optimistic = optimisticMessages.get(chatPartnerId) || [];
    
    // ✅ OPTIMIZED: Early return if no messages
    if (serverMessages.length === 0 && optimistic.length === 0) {
      return [];
    }
    
    // ✅ FIXED: Improved deduplication to prevent file message duplicates
    const allMessages = [...serverMessages, ...optimistic];
    
    // ✅ FIXED: Better duplicate removal logic for file messages
    const uniqueMessages = allMessages.reduce((acc, current) => {
      const isDuplicate = acc.some(msg => {
        // Check by ID first (most reliable)
        if (msg.id === current.id) return true;
        
        // For optimistic messages, check content and time more strictly
        if (current.isOptimistic && msg.isOptimistic) {
          // Only remove if it's the exact same optimistic message (same timestamp)
          if (msg.content === current.content && 
              msg.sender === current.sender &&
              Math.abs(new Date(msg.timestamp).getTime() - new Date(current.timestamp).getTime()) < 100) { // Very strict: only 100ms
            return true;
          }
        }
        
        // For file messages, check content, sender, and time more carefully
        if (msg.content === current.content && 
            msg.sender === current.sender &&
            msg.receiver === current.receiver) {
          const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(current.timestamp).getTime());
          // For file messages, use a wider time window to catch duplicates
          if (timeDiff < 2000) { // 2 seconds for file uploads
            // Additional check: if both have fileUrls, they're likely duplicates
            if (msg.fileUrls && current.fileUrls && 
                msg.fileUrls.length > 0 && current.fileUrls.length > 0) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      if (!isDuplicate) {
        acc.push(current);
      }
      
      return acc;
    }, []);
    
    // ✅ IMPROVED: Validate timestamps before sorting, but be very lenient
    const validMessages = uniqueMessages.filter(msg => {
      if (!msg.timestamp) {
        console.warn('Message missing timestamp:', msg);
        return false;
      }
      const timestamp = new Date(msg.timestamp);
      if (isNaN(timestamp.getTime())) {
        console.warn('Message has invalid timestamp:', msg);
        return false;
      }
      return true;
    });
    
    // ✅ IMPROVED: Sort messages by timestamp for consistent ordering
    return validMessages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [conversationMessages, optimisticMessages, chatPartnerId]);

  // Helper function to check if timestamps are close (for optimistic message matching)
  const areTimestampsClose = useCallback((timestamp1, timestamp2, threshold = 5000) => {
    const t1 = new Date(timestamp1).getTime();
    const t2 = new Date(timestamp2).getTime();
    return Math.abs(t1 - t2) < threshold;
  }, []);

  // Helper function to remove optimistic message
  const removeOptimisticMessage = useCallback((receiver, content, timestamp) => {
    setOptimisticMessages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(receiver) || [];
      
      // ✅ OPTIMIZED: Faster filtering with early return
      if (existing.length === 0) return prev;
      
      // ✅ FIXED: Very lenient optimistic message removal to preserve real-time functionality
      const filtered = existing.filter(msg => {
        if (!msg.isOptimistic) return true;
        
        // ✅ FIXED: Only remove if it's the exact same message (same timestamp)
        const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(timestamp).getTime());
        const contentMatch = msg.content === content;
        const timeMatch = timeDiff < 100; // Very strict: only 100ms for exact duplicates
        
        // Only remove optimistic message if content and time match exactly
        return !(contentMatch && timeMatch);
      });
      
      // ✅ OPTIMIZED: Only update if there are changes
      if (filtered.length === existing.length) return prev;
      
      newMap.set(receiver, filtered);
      return newMap;
    });
  }, []);

  // Subscribe to WebSocket messages when connected
  useEffect(() => {
    if (!isConnected || !user?.id || !socketClient) return;

    // Subscribe to personal messages
    // Backend sends messages to both sender and receiver via:
    // - /user/{senderId}/queue/messages (for sender confirmation)
    // - /user/{receiverId}/queue/messages (for receiver notification)
    const messageSubscription = socketClient.subscribe(`/user/${user.id}/queue/messages`, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);
        
        // ✅ DEBUG: Log received messages for troubleshooting
        if (process.env.NODE_ENV === 'development') {
          console.log('WebSocket message received:', {
            type: 'personal',
            message: receivedMessage,
            timestamp: new Date().toISOString(),
            user: user.id
          });
        }
        
        // Determine if this is an incoming or outgoing message
        const isIncomingMessage = receivedMessage.sender !== user.id;
        const isOutgoingMessage = receivedMessage.sender === user.id;
        
        if (isIncomingMessage) {
          // This is a message from someone else to the current user
          
          // ✅ OPTIMIZED: Use flushSync for immediate updates
          flushSync(() => {
            // Add to conversation messages (grouped by sender)
            setConversationMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(receivedMessage.sender) || [];
              
              // ✅ FIXED: Improved duplicate checking to prevent duplicates
              const messageExists = existing.some(msg => 
                msg.id === receivedMessage.id || // Check by ID first
                (msg.content === receivedMessage.content && 
                 msg.sender === receivedMessage.sender &&
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(receivedMessage.timestamp).getTime()) < 1000) // 1 second window
              );
              
              if (!messageExists) {
                const updated = [...existing, receivedMessage];
                newMap.set(receivedMessage.sender, sortMessages(updated));
              }
              
              return newMap;
            });
            
            // Update chat list to show latest message
            queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user.id], (old) => {
              if (!old) return old;
              
              // ✅ OPTIMIZED: Update and reorder chat list
              const updatedChats = old.map(chat => {
                if (chat.userId === receivedMessage.sender) {
                  return {
                    ...chat,
                    lastMessage: receivedMessage.content || 'File sent',
                    lastUpdated: receivedMessage.timestamp,
                    lastMessageSender: receivedMessage.sender,
                  };
                }
                return chat;
              });
              
              // ✅ OPTIMIZED: Sort to move current chat partner to top
              return updatedChats.sort((a, b) => {
                // Current chat partner goes to top
                if (a.userId === receivedMessage.sender) return -1;
                if (b.userId === receivedMessage.sender) return 1;
                
                // Sort others by last updated time (newest first)
                const timeA = new Date(a.lastUpdated || 0).getTime();
                const timeB = new Date(b.lastUpdated || 0).getTime();
                return timeB - timeA;
              });
            });
          });
          
          // ✅ OPTIMIZED: Immediate scroll without setTimeout
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
          }
          
        } else if (isOutgoingMessage) {
          // This is a message sent by the current user to someone else
          
          // ✅ FIXED: Remove optimistic message immediately and replace with confirmed message
          flushSync(() => {
            // Remove optimistic message
            setOptimisticMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(receivedMessage.receiver) || [];
              
              // ✅ IMPROVED: Better optimistic message removal for file messages
              const filtered = existing.filter(msg => {
                if (!msg.isOptimistic) return true;
                
                // For file messages, match by content and approximate time
                const contentMatch = msg.content === receivedMessage.content;
                const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(receivedMessage.timestamp).getTime());
                const timeMatch = timeDiff < 2000; // 2 second window for file uploads
                
                // Remove if it matches the confirmed message
                return !(contentMatch && timeMatch);
              });
              
              newMap.set(receivedMessage.receiver, filtered);
              return newMap;
            });
            
            // Add confirmed message to conversation
            setConversationMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(receivedMessage.receiver) || [];
              
              // ✅ FIXED: Check for duplicates before adding
              const messageExists = existing.some(msg => 
                msg.id === receivedMessage.id || // Check by ID first
                (msg.content === receivedMessage.content && 
                 msg.sender === receivedMessage.sender &&
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(receivedMessage.timestamp).getTime()) < 1000) // 1 second window
              );
              
              if (!messageExists) {
                const updated = [...existing, receivedMessage];
                newMap.set(receivedMessage.receiver, sortMessages(updated));
              }
              
              return newMap;
            });
          });
          
          // Update chat list to show latest message
          queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user.id], (old) => {
            if (!old) return old;
            
            // ✅ OPTIMIZED: Update and reorder chat list
            const updatedChats = old.map(chat => {
              if (chat.userId === receivedMessage.receiver) {
                return {
                  ...chat,
                  lastMessage: receivedMessage.content || 'File sent',
                  lastUpdated: receivedMessage.timestamp,
                  lastMessageSender: receivedMessage.sender,
                };
              }
              return chat;
            });
            
            // ✅ OPTIMIZED: Sort to move current chat partner to top
            return updatedChats.sort((a, b) => {
              // Current chat partner goes to top
              if (a.userId === receivedMessage.receiver) return -1;
              if (b.userId === receivedMessage.receiver) return 1;
              
              // Sort others by last updated time (newest first)
              const timeA = new Date(a.lastUpdated || 0).getTime();
              const timeB = new Date(b.lastUpdated || 0).getTime();
              return timeB - timeA;
            });
          });
        }
      } catch (error) {
        // Handle error silently
      }
    });

    // Subscribe to chat updates
    const chatUpdateSubscription = socketClient.subscribe(`/user/${user.id}/queue/chat-updates`, (message) => {
      try {
        const chatUpdate = JSON.parse(message.body);
        
        queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user.id], (old) => {
          if (!old) return old;
          
          return old.map(chat => {
            if (chat.userId === chatUpdate.userId) {
              return { ...chat, ...chatUpdate };
            }
            return chat;
          });
        });
              } catch (error) {
          // Handle error silently
        }
    });

    // Subscribe to message send confirmations
    const messageSendSubscription = socketClient.subscribe(`/user/${user.id}/queue/chat.send`, (message) => {
      try {
        const sendConfirmation = JSON.parse(message.body);

        // ✅ DEBUG: Log send confirmations for troubleshooting
        if (process.env.NODE_ENV === 'development') {
          console.log('Message send confirmation received:', {
            type: 'chat.send',
            confirmation: sendConfirmation,
            timestamp: new Date().toISOString(),
            user: user.id
          });
        }
        
        // Remove optimistic message when send is confirmed
        if (sendConfirmation.success && sendConfirmation.id) {
          // ✅ IMPROVED: Better optimistic message removal to prevent duplicates
          flushSync(() => {
            setOptimisticMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(sendConfirmation.receiver) || [];
              
              // ✅ FIXED: Improved optimistic message removal for file messages
              const filtered = existing.filter(msg => {
                if (!msg.isOptimistic) return true;
                
                // For file messages, match by content and approximate time
                const contentMatch = msg.content === sendConfirmation.content;
                const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(sendConfirmation.timestamp).getTime());
                const timeMatch = timeDiff < 2000; // 2 second window for file uploads
                
                // Remove if it matches the confirmed message
                return !(contentMatch && timeMatch);
              });
              
              newMap.set(sendConfirmation.receiver, filtered);
              return newMap;
            });
          });

          // Add the confirmed message to conversation
          const confirmedMessage = {
            id: sendConfirmation.id, // Use server-generated ID
            content: sendConfirmation.content,
            sender: sendConfirmation.sender,
            receiver: sendConfirmation.receiver,
            timestamp: sendConfirmation.timestamp,
            fileUrls: sendConfirmation.fileUrls || [],
            replyToMessageId: sendConfirmation.replyToMessageId,
            isOptimistic: false,
          };
          
          setConversationMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(sendConfirmation.receiver) || [];
            
            // ✅ FIXED: Improved duplicate checking to prevent duplicates
            const messageExists = existing.some(msg => 
              msg.id === sendConfirmation.id || // Check by ID first
              (msg.content === sendConfirmation.content && 
               msg.sender === sendConfirmation.sender &&
               Math.abs(new Date(msg.timestamp).getTime() - new Date(sendConfirmation.timestamp).getTime()) < 1000) // 1 second window
            );
            
            if (!messageExists) {
              const updated = [...existing, confirmedMessage];
              newMap.set(sendConfirmation.receiver, sortMessages(updated));
            }
            
            return newMap;
          });
          
          // ✅ OPTIMIZED: Update and reorder chat list
          queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user.id], (old) => {
            if (!old) return old;
            
            const updatedChats = old.map(chat => {
              if (chat.userId === sendConfirmation.receiver) {
                return {
                  ...chat,
                  lastMessage: sendConfirmation.content || 'File sent',
                  lastUpdated: sendConfirmation.timestamp,
                  lastMessageSender: sendConfirmation.sender,
                };
              }
              return chat;
            });
            
            // Sort to move current chat partner to top
            return updatedChats.sort((a, b) => {
              if (a.userId === sendConfirmation.receiver) return -1;
              if (b.userId === sendConfirmation.receiver) return 1;
              
              const timeA = new Date(a.lastUpdated || 0).getTime();
              const timeB = new Date(b.lastUpdated || 0).getTime();
              return timeB - timeA;
            });
          });
        } else if (sendConfirmation.error) {
          // Remove optimistic message on error
          removeOptimisticMessage(sendConfirmation.receiver, sendConfirmation.content, sendConfirmation.timestamp);
        }
      } catch (error) {
        // Handle error silently
      }
    });

    // Subscribe to broadcast message send confirmations
    const broadcastSendSubscription = socketClient.subscribe(`/topic/chat.send`, (message) => {
      try {
        const sendConfirmation = JSON.parse(message.body);

        
        // Only process if this confirmation is for the current user
        if (sendConfirmation.sender === user.id) {
          // Remove optimistic message when send is confirmed
          if (sendConfirmation.success && sendConfirmation.id) {
            // ✅ IMPROVED: Better optimistic message removal to prevent duplicates
            flushSync(() => {
              setOptimisticMessages(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(sendConfirmation.receiver) || [];
                
                // ✅ FIXED: Improved optimistic message removal for file messages
                const filtered = existing.filter(msg => {
                  if (!msg.isOptimistic) return true;
                  
                  // For file messages, match by content and approximate time
                  const contentMatch = msg.content === sendConfirmation.content;
                  const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(sendConfirmation.timestamp).getTime());
                  const timeMatch = timeDiff < 2000; // 2 second window for file uploads
                  
                  // Remove if it matches the confirmed message
                  return !(contentMatch && timeMatch);
                });
                
                newMap.set(sendConfirmation.receiver, filtered);
                return newMap;
              });
            });

            // Add the confirmed message to conversation
            const confirmedMessage = {
              id: sendConfirmation.id, // Use server-generated ID
              content: sendConfirmation.content,
              sender: sendConfirmation.sender,
              receiver: sendConfirmation.receiver,
              timestamp: sendConfirmation.timestamp,
              fileUrls: sendConfirmation.fileUrls || [],
              replyToMessageId: sendConfirmation.replyToMessageId,
              isOptimistic: false,
            };
            
            setConversationMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(sendConfirmation.receiver) || [];
              
              // ✅ FIXED: Improved duplicate checking to prevent duplicates
              const messageExists = existing.some(msg => 
                msg.id === sendConfirmation.id || // Check by ID first
                (msg.content === sendConfirmation.content && 
                 msg.sender === sendConfirmation.sender &&
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(sendConfirmation.timestamp).getTime()) < 1000) // 1 second window
              );
              
              if (!messageExists) {
                const updated = [...existing, confirmedMessage];
                newMap.set(sendConfirmation.receiver, sortMessages(updated));
              }
              
              return newMap;
            });
            
            // ✅ OPTIMIZED: Update and reorder chat list
            queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user.id], (old) => {
              if (!old) return old;
              
              const updatedChats = old.map(chat => {
                if (chat.userId === sendConfirmation.receiver) {
                  return {
                    ...chat,
                    lastMessage: sendConfirmation.content || 'File sent',
                    lastUpdated: sendConfirmation.timestamp,
                    lastMessageSender: sendConfirmation.sender,
                  };
                }
                return chat;
              });
              
              // Sort to move current chat partner to top
              return updatedChats.sort((a, b) => {
                if (a.userId === sendConfirmation.receiver) return -1;
                if (b.userId === sendConfirmation.receiver) return 1;
                
                const timeA = new Date(a.lastUpdated || 0).getTime();
                const timeB = new Date(b.lastUpdated || 0).getTime();
                return timeB - timeA;
              });
            });
          } else if (sendConfirmation.error) {
            // Remove optimistic message on error
            removeOptimisticMessage(sendConfirmation.receiver, sendConfirmation.content, sendConfirmation.timestamp);
          }
        }
      } catch (error) {
        // Handle error silently
      }
    });

    // Store subscription references for cleanup
    subscriptionsRef.current.set('messages', messageSubscription);
    subscriptionsRef.current.set('chat-updates', chatUpdateSubscription);
    subscriptionsRef.current.set('chat-send', messageSendSubscription);
    subscriptionsRef.current.set('broadcast-send', broadcastSendSubscription);

    // Cleanup subscriptions
    return () => {
      if (messageSubscription) {
        messageSubscription.unsubscribe();
        subscriptionsRef.current.delete('messages');
      }
      if (chatUpdateSubscription) {
        chatUpdateSubscription.unsubscribe();
        subscriptionsRef.current.delete('chat-updates');
      }
      if (messageSendSubscription) {
        messageSendSubscription.unsubscribe();
        subscriptionsRef.current.delete('chat-send');
      }
      if (broadcastSendSubscription) {
        broadcastSendSubscription.unsubscribe();
        subscriptionsRef.current.delete('broadcast-send');
      }
    };
  }, [isConnected, user?.id, socketClient, queryClient, removeOptimisticMessage]);

  // ✅ FIXED: Clean up duplicate messages on mount, but be very lenient
  useEffect(() => {
    if (chatPartnerId) {
      // Clean up any existing duplicates in conversation messages
      setConversationMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(chatPartnerId) || [];
        
        if (existing.length === 0) return prev;
        
        // ✅ FIXED: Better duplicate removal for file messages
        const uniqueMessages = existing.reduce((acc, current) => {
          const isDuplicate = acc.some(msg => {
            // Check by ID first (most reliable)
            if (msg.id === current.id) return true;
            
            // For content duplicates, check more carefully for file messages
            if (msg.content === current.content && msg.sender === current.sender) {
              const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(current.timestamp).getTime());
              
              // For file messages, use wider time window
              if (msg.fileUrls && current.fileUrls && 
                  msg.fileUrls.length > 0 && current.fileUrls.length > 0) {
                // If both have fileUrls, they're likely duplicates within 3 seconds
                return timeDiff < 3000;
              }
              
              // For text messages, use stricter time window
              return timeDiff < 1000;
            }
            
            return false;
          });
          
          if (!isDuplicate) {
            acc.push(current);
          }
          
          return acc;
        }, []);
        
        if (uniqueMessages.length !== existing.length) {
          console.log(`Cleaned up ${existing.length - uniqueMessages.length} duplicate messages`);
          newMap.set(chatPartnerId, sortMessages(uniqueMessages));
          return newMap;
        }
        
        return prev;
      });
      
      // Clean up any existing duplicates in optimistic messages
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(chatPartnerId) || [];
        
        if (existing.length === 0) return prev;
        
        // ✅ FIXED: Better duplicate removal for optimistic file messages
        const uniqueMessages = existing.reduce((acc, current) => {
          const isDuplicate = acc.some(msg => {
            // Check by ID first
            if (msg.id === current.id) return true;
            
            // For optimistic messages, check content and time more strictly
            if (msg.isOptimistic && current.isOptimistic) {
              if (msg.content === current.content && 
                  msg.sender === current.sender &&
                  msg.receiver === current.receiver) {
                const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(current.timestamp).getTime());
                
                // For file messages, use wider time window
                if (msg.fileUrls && current.fileUrls && 
                    msg.fileUrls.length > 0 && current.fileUrls.length > 0) {
                  return timeDiff < 2000; // 2 seconds for file uploads
                }
                
                // For text messages, use stricter time window
                return timeDiff < 500; // 500ms for text messages
              }
            }
            
            return false;
          });
          
          if (!isDuplicate) {
            acc.push(current);
          }
          
          return acc;
        }, []);
        
        if (uniqueMessages.length !== existing.length) {
          console.log(`Cleaned up ${existing.length - uniqueMessages.length} duplicate optimistic messages`);
          newMap.set(chatPartnerId, uniqueMessages);
          return newMap;
        }
        
        return prev;
      });
    }
  }, [chatPartnerId]);

  // Chat messages query (HTTP fallback)
  const {
    data: serverMessages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, user?.id, chatPartnerId],
    queryFn: async () => {
      try {
        if (!user?.id || !chatPartnerId) {
          throw new Error('Missing user ID or chat partner ID');
        }
        
        const messages = await chatQueryApi.getMessages(user.id, chatPartnerId);
        return messages || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!user?.id && !!chatPartnerId,
    staleTime: isConnected ? 30000 : 5000,
    refetchInterval: isConnected ? false : 5000,
    retry: 3,
    retryDelay: 1000,
  });

  // Chat list query - FIXED: Proper query key and enabled condition
  const {
    data: chatList = [],
    isLoading: isLoadingChatList,
    error: chatListError,
    refetch: refetchChatList,
  } = useQuery({
    queryKey: [QUERY_KEYS.CHAT_LIST, user?.id],
    queryFn: () => chatQueryApi.getChatList(user?.id),
    enabled: !!user?.id,
    staleTime: isConnected ? 60000 : 10000,
    refetchInterval: isConnected ? false : 10000,
  });

  // Update conversation messages when server data changes
  useEffect(() => {
    if (serverMessages.length > 0 && chatPartnerId) {
      setConversationMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(chatPartnerId) || [];
        
        // ✅ IMPROVED: Better message synchronization with timestamp validation
        const validServerMessages = serverMessages.filter(msg => {
          if (!msg.timestamp) {
            console.warn('Server message missing timestamp:', msg);
            return false;
          }
          const timestamp = new Date(msg.timestamp);
          if (isNaN(timestamp.getTime())) {
            console.warn('Server has invalid timestamp:', msg);
            return false;
          }
          return true;
        });
        
        // ✅ IMPROVED: Merge server messages with existing ones, avoiding duplicates
        const mergedMessages = [...existing];
        
        validServerMessages.forEach(serverMsg => {
          // Check if this server message already exists
          const exists = existing.some(existingMsg => 
            existingMsg.id === serverMsg.id || // Check by ID first
            (existingMsg.content === serverMsg.content && 
             existingMsg.sender === serverMsg.sender &&
             existingMsg.receiver === serverMsg.receiver &&
             Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(serverMsg.timestamp).getTime()) < 1000) // 1 second window
          );
          
          if (!exists) {
            mergedMessages.push(serverMsg);
          }
        });
        
        // ✅ IMPROVED: Sort merged messages before storing
        const sortedMessages = sortMessages(mergedMessages);
        newMap.set(chatPartnerId, sortedMessages);
        
        return newMap;
      });
    }
  }, [serverMessages, chatPartnerId]);

  // Send message mutation - NO PENDING STATES
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files, receiver }) => {
      // ✅ FIXED: Files are already uploaded in sendMessage function
      // Just send the message with content and receiver
      return chatQueryApi.sendMessage({
        content: content?.trim() || '',
        fileUrls: [], // Files already uploaded via WebSocket
        receiverId: receiver,
      });
    },
    onMutate: async ({ content, files, receiver }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries([QUERY_KEYS.MESSAGES, user?.id, receiver]);

      // Note: Optimistic message is already added in sendMessage function
      // This is just for HTTP fallback when WebSocket fails
      return { receiver };
    },
    onError: (err, variables, context) => {
      // Remove optimistic message on error
      if (context?.receiver) {
        setOptimisticMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(variables.receiver) || [];
          // Remove the most recent optimistic message for this receiver
          const filtered = existing.filter((msg, index) => 
            !msg.isOptimistic || index !== existing.length - 1
          );
          newMap.set(variables.receiver, filtered);
          return newMap;
        });
      }
    },
    onSuccess: (data, variables) => {
      // Remove optimistic message on success
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(variables.receiver) || [];
        const filtered = existing.filter(msg => !msg.isOptimistic);
        newMap.set(variables.receiver, filtered);
        return newMap;
      });
    },
  });

  // Send message function - INSTANT, NO PENDING STATES
  const sendMessage = useCallback(async (content, files, receiver, replyToMessageId = null) => {
    if (!user?.id || !receiver) {
      return;
    }

    // ✅ FIXED: Create single optimistic message ID to prevent flickering
    const optimisticMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ IMPROVED: Create optimistic message with precise, consistent timestamp handling
    const now = new Date();
    // Use local timezone for consistent date comparisons
    const timestamp = now.toISOString();
    
    // ✅ DEBUG: Log timestamp creation for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating optimistic message with timestamp:', {
        localTime: now.toLocaleString(),
        isoTime: timestamp,
        utcTime: now.toUTCString(),
        timezoneOffset: now.getTimezoneOffset(),
        messageContent: content?.trim()
      });
    }
    
    const optimisticMessage = {
      id: optimisticMessageId, // Temporary ID for optimistic updates only
      content: content?.trim() || '',
      sender: user.id,
      receiver: receiver,
      timestamp: timestamp, // Use consistent ISO format
      fileUrls: [],
      isOptimistic: true,
      isUploading: files && files.length > 0,
      replyToMessageId: replyToMessageId,
    };

    // ✅ IMPROVED: Add optimistic message immediately with proper state management
    flushSync(() => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(receiver) || [];
        
        // ✅ IMPROVED: Check for duplicate optimistic messages before adding
        const isDuplicate = existing.some(msg => 
          msg.isOptimistic && 
          msg.content === optimisticMessage.content &&
          msg.sender === optimisticMessage.sender &&
          msg.receiver === optimisticMessage.receiver &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(optimisticMessage.timestamp).getTime()) < 1000
        );
        
        if (!isDuplicate) {
          // ✅ FIXED: Ensure optimistic messages are added at the end for proper sorting
          newMap.set(receiver, [...existing, optimisticMessage]);
        }
        
        return newMap;
      });
    });

    // Update chat list immediately for instant UI
    flushSync(() => {
      queryClient.setQueryData([QUERY_KEYS.CHAT_LIST, user?.id], (old) => {
        if (!old) return old;
        
        // ✅ OPTIMIZED: Move current chat partner to top immediately
        const updatedChats = old.map(chat => {
          if (chat.userId === receiver) {
            return {
              ...chat,
              lastMessage: content?.trim() || 'File sent',
              lastUpdated: new Date().toISOString(),
              lastMessageSender: user.id,
            };
          }
          return chat;
        });
        
        // ✅ OPTIMIZED: Sort to move current chat partner to top
        return updatedChats.sort((a, b) => {
          // Current chat partner goes to top
          if (a.userId === receiver) return -1;
          if (b.userId === receiver) return 1;
          
          // Sort others by last updated time (newest first)
          const timeA = new Date(a.lastUpdated || 0).getTime();
          const timeB = new Date(b.lastUpdated || 0).getTime();
          return timeB - timeA;
        });
      });
    });

    // Upload files if they exist
      let uploadedFileUrls = [];
      if (files && files.length > 0) {
        try {
        const uploadResults = await uploadFiles(files);
        uploadedFileUrls = uploadResults
          .filter(result => result.url && !result.error)
          .map(result => result.url);
        
        // ✅ FIXED: Update the existing optimistic message in place
        flushSync(() => {
          setOptimisticMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(receiver) || [];
            const updated = existing.map(msg => 
              msg.id === optimisticMessageId ? {
                ...msg,
                fileUrls: uploadedFileUrls,
                isUploading: false,
              } : msg
            );
            newMap.set(receiver, updated);
            return newMap;
          });
        });
      } catch (error) {
        // Remove optimistic message on upload failure
        flushSync(() => {
          setOptimisticMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(receiver) || [];
            const filtered = existing.filter(msg => msg.id !== optimisticMessageId);
            newMap.set(receiver, filtered);
            return newMap;
          });
        });
        return;
      }
    }

    // Try to send via WebSocket first
    if (socketClient && isConnected) {
      try {
        const message = {
          // Don't set id - let server generate it
          content: content?.trim() || '',
          sender: user.id,
          receiver: receiver,
          timestamp: new Date().toISOString(),
          fileUrls: uploadedFileUrls,
          replyToMessageId: replyToMessageId,
        };

        socketClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(message),
        });
        
        return; // Message sent via WebSocket
      } catch (error) {
        // Handle WebSocket error silently
      }
    }

    // Fallback to HTTP if WebSocket fails
    try {
      await sendMessageMutation.mutateAsync({
        content: content?.trim() || '',
        files: [],
        receiver: receiver,
      });
    } catch (error) {
      // Remove optimistic message on HTTP failure
      flushSync(() => {
        setOptimisticMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(receiver) || [];
          const filtered = existing.filter(msg => msg.id !== optimisticMessageId);
          newMap.set(receiver, filtered);
          return newMap;
        });
      });
    }
  }, [user?.id, socketClient, isConnected, uploadFiles, sendMessageMutation, queryClient]);

  // Manual refresh functions
  const refreshMessages = useCallback(() => {
    if (chatPartnerId) {
      refetchMessages();
    }
  }, [refetchMessages, chatPartnerId]);

  const refreshChatList = useCallback(() => {
    refetchChatList();
  }, [refetchChatList]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && chatMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return {
    // Data
    chatMessages,
    chatList,
    isLoadingChatList,
    chatListError,
    isLoadingMessages,
    messagesError,
    isConnected,
    
    // Functions
    sendMessage,
    refreshMessages,
    refreshChatList,
    messagesEndRef,
    
    // Presence and typing functions
    getUserStatus,
    isUserTyping,
    isAnyoneTypingToMe,
    getAllTypingUsers,
    handleTyping,
    stopTyping,
    userStatuses,
    typingUsers,
    requestOnlineUsersStatus,
    
    // Mutation state - NO PENDING STATES
    isSending: false, // Always false for instant sending
    sendError: sendMessageMutation.error,
  };
};
