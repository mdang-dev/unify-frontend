import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './use-socket';
import { useAuthStore } from '@/src/stores/auth.store';


export const usePresence = () => {
  const { connected: isConnected, client: socketClient } = useSocket();
  const user = useAuthStore((s) => s.user);
  
  // State for user status and typing
  const [userStatuses, setUserStatuses] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isUserActive, setIsUserActive] = useState(true);
  
  // Refs for cleanup
  const subscriptionsRef = useRef(new Map());
  const typingTimeoutRef = useRef(new Map());
  const activityTimeoutRef = useRef(null);
  
  // Helper function to update user status
  const updateUserStatus = useCallback((userId, status) => {
    setUserStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        ...newMap.get(userId),
        ...status,
        lastUpdated: new Date().toISOString()
      });
      return newMap;
    });
  }, []);
  
  // Helper function to update typing status
  const updateTypingStatus = useCallback((userId, receiverId, isTyping) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev);
      const key = `${userId}-${receiverId}`;
      
      if (isTyping) {
        newMap.set(key, {
          userId,
          receiverId,
          isTyping: true,
          timestamp: new Date().toISOString()
        });
      } else {
        newMap.delete(key);
      }
      
      return newMap;
    });
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Typing status updated: ${userId} -> ${receiverId} = ${isTyping}`);
    }
  }, []);
  
  // Function to send typing event
  const sendTypingEvent = useCallback((receiverId, isTyping) => {
    if (!socketClient || !isConnected || !user?.id) return;
    
    try {
      const typingPayload = {
        fromUser: user.id,
        toUser: receiverId,
        typing: isTyping,
        timestamp: new Date().toISOString()
      };
      
      // Debug: Log what we're sending
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending typing event:', typingPayload);
      }
      
      // Send typing event to backend
      socketClient.publish({
        destination: '/app/typing',
        body: JSON.stringify(typingPayload)
      });
      
      // Also update local state immediately for instant feedback
      if (isTyping) {
        updateTypingStatus(user.id, receiverId, true);
      } else {
        updateTypingStatus(user.id, receiverId, false);
      }
    } catch (error) {
      console.error('Error sending typing event:', error);
    }
  }, [socketClient, isConnected, user?.id, updateTypingStatus]);
  
  // Function to set user as inactive
  const setUserInactive = useCallback(() => {
    if (!socketClient || !isConnected || !user?.id) return;
    
    try {
      socketClient.publish({
        destination: '/app/presence/inactive',
        body: user.id // Backend expects String userId, not JSON
      });
      setIsUserActive(false);
    } catch (error) {
      console.error('Error setting user inactive:', error);
    }
  }, [socketClient, isConnected, user?.id]);
  
  // Function to set user as active
  const setUserActive = useCallback(() => {
    if (!isUserActive) {
      setIsUserActive(true);
      // Trigger presence subscription to notify backend
      if (socketClient && isConnected && user?.id) {
        try {
          socketClient.publish({
            destination: '/app/presence',
            body: user.id
          });
          
          // Update local status
          updateUserStatus(user.id, {
            active: true,
            lastActive: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error triggering presence subscription:', error);
        }
      }
    }
  }, [isUserActive, socketClient, isConnected, user?.id, updateUserStatus]);

  // Function to request online users status
  const requestOnlineUsersStatus = useCallback(() => {
    if (socketClient && isConnected && user?.id) {
      try {
        socketClient.publish({
          destination: '/app/presence/request-online-users',
          body: user.id
        });
      } catch (error) {
        console.error('Error requesting online users status:', error);
      }
    }
  }, [socketClient, isConnected, user?.id]);
  
  // Function to handle typing with debounce
  const handleTyping = useCallback((receiverId, isTyping = true) => {
    if (!user?.id || !receiverId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current.has(receiverId)) {
      clearTimeout(typingTimeoutRef.current.get(receiverId));
    }
    
    // Send typing event immediately
    sendTypingEvent(receiverId, isTyping);
    
    if (isTyping) {
      // Set timeout to stop typing after 3 seconds of inactivity
      const timeoutId = setTimeout(() => {
        sendTypingEvent(receiverId, false);
        typingTimeoutRef.current.delete(receiverId);
      }, 3000);
      
      typingTimeoutRef.current.set(receiverId, timeoutId);
    } else {
      typingTimeoutRef.current.delete(receiverId);
    }
  }, [user?.id, sendTypingEvent]);
  
  // Function to stop typing
  const stopTyping = useCallback((receiverId) => {
    if (!user?.id || !receiverId) return;
    
    // Clear timeout
    if (typingTimeoutRef.current.has(receiverId)) {
      clearTimeout(typingTimeoutRef.current.get(receiverId));
      typingTimeoutRef.current.delete(receiverId);
    }
    
    // Send stop typing event
    sendTypingEvent(receiverId, false);
    
    // Clear local typing state immediately
    updateTypingStatus(user.id, receiverId, false);
  }, [user?.id, sendTypingEvent, updateTypingStatus]);

  // Function to force clear all typing states (useful for cleanup)
  const clearAllTypingStates = useCallback(() => {
    if (!user?.id) return;
    
    // Clear all timeouts
    typingTimeoutRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    typingTimeoutRef.current.clear();
    
    // Clear all local typing states
    setTypingUsers(new Map());
  }, [user?.id]);


  
  // Function to get user status
  const getUserStatus = useCallback((userId) => {
    return userStatuses.get(userId) || {
      active: false,
      lastActive: null,
      typing: null
    };
  }, [userStatuses]);


  
  // Function to check if user is typing to specific receiver
  const isUserTyping = useCallback((userId, receiverId) => {
    const key = `${userId}-${receiverId}`;
    return typingUsers.has(key);
  }, [typingUsers]);

  // Function to get all typing users (for debugging)
  const getAllTypingUsers = useCallback(() => {
    return Array.from(typingUsers.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }, [typingUsers]);

  // Function to check if anyone is typing to current user
  const isAnyoneTypingToMe = useCallback(() => {
    return Array.from(typingUsers.entries()).some(([key, value]) => 
      value.receiverId === user?.id && value.isTyping
    );
  }, [typingUsers, user?.id]);
  
  // Set up WebSocket subscriptions when connected
  useEffect(() => {
    if (!isConnected || !user?.id || !socketClient) return;
    
    // Subscribe to typing events for current user (receiving typing events)
    const typingSubscription = socketClient.subscribe(`/topic/typing.${user.id}`, (message) => {
      try {
        const typingEvent = JSON.parse(message.body);
        // Debug: Log the actual typing event structure
        if (process.env.NODE_ENV === 'development') {
          console.log('Received typing event (personal):', typingEvent);
        }
        
        // Backend sends TypingEvent with fromUser and toUser
        // Check if this is a typing start or stop event
        const isTyping = typingEvent.typing !== false; // Default to true if not specified
        
        // Only update typing status if this event is FOR the current user
        if (typingEvent.toUser === user.id) {
          updateTypingStatus(typingEvent.fromUser, typingEvent.toUser, isTyping);
        }
      } catch (error) {
        console.error('Error parsing typing event:', error);
      }
    });

    // Subscribe to global typing events (for bidirectional visibility)
    const globalTypingSubscription = socketClient.subscribe('/topic/typing', (message) => {
      try {
        const typingEvent = JSON.parse(message.body);
        // Debug: Log the actual typing event structure
        if (process.env.NODE_ENV === 'development') {
          console.log('Received typing event (global):', typingEvent);
        }
        
        // This receives ALL typing events in the system
        
        // Only process if this event involves the current user
        if (typingEvent.fromUser === user.id || typingEvent.toUser === user.id) {
          const isTyping = typingEvent.typing !== false;
          
          if (typingEvent.fromUser === user.id) {
            // This user is typing to someone else
            // Update local state to track outgoing typing
            updateTypingStatus(typingEvent.fromUser, typingEvent.toUser, isTyping);
          } else if (typingEvent.toUser === user.id) {
            // Someone is typing to this user
            // Update local state to show incoming typing
            updateTypingStatus(typingEvent.fromUser, typingEvent.toUser, isTyping);
          }
        }
      } catch (error) {
        console.error('Error parsing global typing event:', error);
      }
    });
    
    // Subscribe to global status updates (broadcasted by backend)
    const statusSubscription = socketClient.subscribe('/topic/status', (message) => {
      try {
        const statusUpdate = JSON.parse(message.body);
        // Backend broadcasts status updates to all users
        updateUserStatus(statusUpdate.userId, {
          active: statusUpdate.active,
          lastActive: statusUpdate.lastActive || new Date().toISOString()
        });
      } catch (error) {
        console.error('Error parsing status update:', error);
      }
    });
    
    // Subscribe to online users list (sent when user connects)
    const onlineUsersSubscription = socketClient.subscribe(`/queue/${user.id}/online-users`, (message) => {
      try {
        const onlineUsers = JSON.parse(message.body);
        // Backend sends list of currently online users
        onlineUsers.forEach(userId => {
          if (userId !== user.id) { // Don't update own status
            updateUserStatus(userId, {
              active: true,
              lastActive: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        console.error('Error parsing online users list:', error);
      }
    });
    
    // Store subscriptions for cleanup
    subscriptionsRef.current.set('typing', typingSubscription);
    subscriptionsRef.current.set('global-typing', globalTypingSubscription);
    subscriptionsRef.current.set('status', statusSubscription);
    subscriptionsRef.current.set('online-users', onlineUsersSubscription);
    
    // Trigger initial presence subscription to notify backend
    // This will call the @MessageMapping("/presence") endpoint
    try {
      socketClient.publish({
        destination: '/app/presence',
        body: user.id
      });
      
      // Set user as active immediately
      updateUserStatus(user.id, {
        active: true,
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error triggering initial presence subscription:', error);
    }
    
    // Cleanup subscriptions
    return () => {
      if (typingSubscription) {
        typingSubscription.unsubscribe();
        subscriptionsRef.current.delete('typing');
      }
      if (globalTypingSubscription) {
        globalTypingSubscription.unsubscribe();
        subscriptionsRef.current.delete('global-typing');
      }
      if (statusSubscription) {
        statusSubscription.unsubscribe();
        subscriptionsRef.current.delete('status');
      }
      if (onlineUsersSubscription) {
        onlineUsersSubscription.unsubscribe();
        subscriptionsRef.current.delete('online-users');
      }
    };
  }, [isConnected, user?.id, socketClient, updateUserStatus, updateTypingStatus]);
  
  // Set up activity tracking
  useEffect(() => {
    if (!user?.id) return;
    
    const handleActivity = () => {
      setUserActive();
      
      // Clear existing timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Set new timeout for inactivity (5 minutes)
      activityTimeoutRef.current = setTimeout(() => {
        setUserInactive();
      }, 5 * 60 * 1000);
    };
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initial activity
    handleActivity();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [user?.id, setUserActive, setUserInactive]);
  
  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      typingTimeoutRef.current.clear();
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  // Clear typing states when user changes
  useEffect(() => {
    if (user?.id) {
      // Clear any existing typing states when user changes
      clearAllTypingStates();
    }
  }, [user?.id, clearAllTypingStates]);

  // Handle browser tab close and page unload to set user as offline
  useEffect(() => {
    if (!user?.id || !socketClient) return;

    const handleBeforeUnload = () => {
      // Set user as inactive when browser tab is closed
      setUserInactive();
      
      // Also try to send a direct message to backend
      try {
        if (socketClient.connected) {
          socketClient.publish({
            destination: '/app/presence/inactive',
            body: user.id
          });
        }
      } catch (error) {
        console.error('Error sending inactive status on unload:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden (tab switch, minimize, etc.)
        // Don't set as inactive immediately, just mark as away
        setUserInactive();
      } else if (document.visibilityState === 'visible') {
        // Page is visible again, mark as active
        setUserActive();
      }
    };

    const handleOnline = () => {
      // Internet connection restored
      setUserActive();
    };

    const handleOffline = () => {
      // Internet connection lost
      setUserInactive();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, socketClient, setUserActive, setUserInactive]);
  
  return {
    // State
    userStatuses,
    typingUsers,
    isUserActive,
    
    // Functions
    getUserStatus,
    isUserTyping,
    isAnyoneTypingToMe,
    getAllTypingUsers,
    handleTyping,
    stopTyping,
    clearAllTypingStates,
    setUserActive,
    setUserInactive,
    requestOnlineUsersStatus,
    
    // Connection status
    isConnected
  };
};
