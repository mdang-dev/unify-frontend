import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFiles } from '../utils/upload-files.util';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { chatQueryApi } from '../apis/chat/query/chat.query.api';
import { getVietnamTimeISO } from '../utils/timezone.util';
import { useSocket } from './use-socket';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { getCookie } from '../utils/cookies.util';
import { flushSync } from 'react-dom';

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
  // Use existing socket hook
  const { connected: isConnected, client: socketClient } = useSocket();
  
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
    
    // ✅ OPTIMIZED: Only sort if we have multiple messages
    if (serverMessages.length + optimistic.length <= 1) {
      return [...serverMessages, ...optimistic];
    }
    
    return sortMessages([...serverMessages, ...optimistic]);
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
      
      // ✅ OPTIMIZED: More efficient filtering
      const filtered = existing.filter(msg => {
        if (!msg.isOptimistic) return true;
        
        // ✅ OPTIMIZED: Faster timestamp comparison
        const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(timestamp).getTime());
        return !(msg.content === content && timeDiff < 3000); // Reduced to 3 seconds for faster matching
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
              const updated = [...existing, receivedMessage];
              newMap.set(receivedMessage.sender, sortMessages(updated));
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
          
          // ✅ OPTIMIZED: Remove optimistic message immediately
          removeOptimisticMessage(receivedMessage.receiver, receivedMessage.content, receivedMessage.timestamp);
          
          // ✅ OPTIMIZED: Use flushSync for immediate updates
          flushSync(() => {
            // Add to conversation messages (grouped by receiver)
            setConversationMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(receivedMessage.receiver) || [];
              const updated = [...existing, receivedMessage];
              newMap.set(receivedMessage.receiver, sortMessages(updated));
              return newMap;
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

        
        // Remove optimistic message when send is confirmed
        if (sendConfirmation.success && sendConfirmation.id) {
          removeOptimisticMessage(sendConfirmation.receiver, sendConfirmation.content, sendConfirmation.timestamp);
          
          // Add the confirmed message to conversation
          const confirmedMessage = {
            id: sendConfirmation.id,
            content: sendConfirmation.content,
            sender: sendConfirmation.sender,
            receiver: sendConfirmation.receiver,
            timestamp: sendConfirmation.timestamp,
            fileUrls: sendConfirmation.fileUrls || [],
            isOptimistic: false,
          };
          
          setConversationMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(sendConfirmation.receiver) || [];
            const updated = [...existing, confirmedMessage];
            newMap.set(sendConfirmation.receiver, sortMessages(updated));
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
            removeOptimisticMessage(sendConfirmation.receiver, sendConfirmation.content, sendConfirmation.timestamp);
            
            // Add the confirmed message to conversation
            const confirmedMessage = {
              id: sendConfirmation.id,
              content: sendConfirmation.content,
              sender: sendConfirmation.sender,
              receiver: sendConfirmation.receiver,
              timestamp: sendConfirmation.timestamp,
              fileUrls: sendConfirmation.fileUrls || [],
              isOptimistic: false,
            };
            
            setConversationMessages(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(sendConfirmation.receiver) || [];
              const updated = [...existing, confirmedMessage];
              newMap.set(sendConfirmation.receiver, sortMessages(updated));
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
        newMap.set(chatPartnerId, sortMessages(serverMessages));
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
  const sendMessage = useCallback(async (content, files, receiver) => {
    if (!user?.id || !receiver) {
      return;
    }

    // ✅ FIXED: Create single optimistic message ID to prevent flickering
    const optimisticMessageId = `temp-${Date.now()}`;
    
    // ✅ FIXED: Upload files first if they exist
    let uploadedFileUrls = [];
    if (files && files.length > 0) {
      try {

        
        // Show optimistic message immediately with "Uploading..." status
        const optimisticMessage = {
          id: optimisticMessageId,
          content: content?.trim() || '',
          sender: user.id,
          receiver: receiver,
          timestamp: getVietnamTimeISO(),
          fileUrls: files.map(file => {
            const fileName = file.file?.name || file.name || 'file';
            return `Uploading ${fileName}...`;
          }),
          isOptimistic: true,
          isUploading: true,
        };

        // Add optimistic message immediately
        flushSync(() => {
          setOptimisticMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(receiver) || [];
            newMap.set(receiver, [...existing, optimisticMessage]);
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
                  lastUpdated: getVietnamTimeISO(),
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

        // Upload files
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
        // Continue with message sending even if file upload fails
      }
    } else {
      // Text-only message - create optimistic message immediately
      const optimisticMessage = {
        id: optimisticMessageId,
        content: content?.trim() || '',
        sender: user.id,
        receiver: receiver,
        timestamp: getVietnamTimeISO(),
        fileUrls: [],
        isOptimistic: true,
      };

      // Add optimistic message immediately
      flushSync(() => {
        setOptimisticMessages(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(receiver) || [];
          newMap.set(receiver, [...existing, optimisticMessage]);
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
                lastMessage: content?.trim() || '',
                lastUpdated: getVietnamTimeISO(),
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
    }

    // Try WebSocket first if connected
    if (isConnected && socketClient) {
      try {
        // ✅ DEBUG: Log the files structure to identify the issue

        
        const message = {
          content: content?.trim() || '',
          fileUrls: uploadedFileUrls, // Use uploaded URLs
          receiver: receiver,
          sender: user.id,
          timestamp: getVietnamTimeISO(),
        };

        // ✅ DEBUG: Log the final message structure
        

        socketClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(message),
          headers: {
            'Authorization': `Bearer ${getCookie(COOKIE_KEYS.AUTH_TOKEN) || user?.token || ''}`,
          },
        });

        
        return; // Message sent via WebSocket
              } catch (error) {
          // Handle WebSocket error silently
        }
    }

    // Fallback to HTTP - NO PENDING STATES
    sendMessageMutation.mutate({ content, files, receiver });
  }, [user?.id, user?.token, isConnected, socketClient, sendMessageMutation, queryClient]);

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
    
    // Mutation state - NO PENDING STATES
    isSending: false, // Always false for instant sending
    sendError: sendMessageMutation.error,
  };
};
