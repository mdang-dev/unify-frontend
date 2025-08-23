'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  REPORT_THRESHOLDS, 
  getReportStatus, 
  shouldAutoLogout, 
  getLogoutMessage, 
  getWarningMessage 
} from '../utils/report-utils';

/**
 * Hook for monitoring user report count via WebSocket
 * Handles automatic logout and notifications based on report thresholds
 */
export const useReportCount = () => {
  const { user, clearUser } = useAuthStore();
  const router = useRouter();
  const [currentReportCount, setCurrentReportCount] = useState(0);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  
  const stompClientRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  /**
   * Handle automatic logout when report thresholds are reached
   */
  const handleAutomaticLogout = useCallback((reportCount, reason) => {
    // Clear user data
    clearUser();
    
    // Clear authentication cookies
    document.cookie = `${COOKIE_KEYS.AUTH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${COOKIE_KEYS.REFRESH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Show appropriate notification
    toast.error(reason, {
      duration: 5000,
      position: 'top-center'
    });
    
    // Redirect to login page
    router.push('/login');
  }, [clearUser, router]);

  /**
   * Process WebSocket messages for report count updates
   */
  const handleReportCountMessage = useCallback((message) => {
    try {
      const data = JSON.parse(message.body);
      
      if (data.type === 'reportCountUpdate') {
        const newReportCount = data.reportCount || 0;
        setCurrentReportCount(newReportCount);
        
        // Check thresholds and handle automatic logout
        if (shouldAutoLogout(newReportCount)) {
          const logoutMessage = getLogoutMessage(newReportCount);
          if (logoutMessage) {
            handleAutomaticLogout(newReportCount, logoutMessage);
          }
        } else if (newReportCount > 0) {
          // Show warning for users with reports but below suspension threshold
          const warningMessage = getWarningMessage(newReportCount);
          if (warningMessage) {
            toast.warning(warningMessage, { duration: 4000 });
          }
        }
      }
    } catch (error) {
      console.error('Failed to process report count message:', error);
    }
  }, [handleAutomaticLogout]);

  /**
   * Setup WebSocket connection for report count monitoring
   */
  const setupWebSocket = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
      if (!token) {
        return;
      }

      // Get CSRF token
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
          console.error('Failed to fetch CSRF token for report count WebSocket:', error.message);
        }
      }

      // Create WebSocket connection
      const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      });
      
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          userId: user.id,
          token: `Bearer ${token}`,
          ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 15000,
        heartbeatOutgoing: 15000,
        onConnect: () => {
          try {
            // Subscribe to report count updates
            client.subscribe(`/user/${user.id}/queue/reportCount`, handleReportCountMessage);
            setIsWebSocketConnected(true);
          } catch (error) {
            console.error('Failed to subscribe to report count updates:', error);
          }
        },
        onStompError: (frame) => {
          console.error('STOMP error in report count WebSocket:', frame);
          setIsWebSocketConnected(false);
        },
        onWebSocketError: (event) => {
          console.error('WebSocket error in report count monitoring:', event);
          setIsWebSocketConnected(false);
        },
        onWebSocketClose: (event) => {
          setIsWebSocketConnected(false);
        },
      });

      try {
        client.activate();
        stompClientRef.current = client;
      } catch (error) {
        console.error('Report count WebSocket client activation failed:', error);
      }
    } catch (error) {
      console.error('Report count WebSocket setup failed:', error);
    }
  }, [user?.id, handleReportCountMessage]);

  /**
   * Cleanup WebSocket connection
   */
  const cleanupWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      } catch (error) {
        console.error('Error deactivating report count WebSocket:', error);
      }
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsWebSocketConnected(false);
  }, []);

  // Setup WebSocket when user changes
  useEffect(() => {
    if (user?.id) {
      setupWebSocket();
      
      // Set initial report count from user data
      setCurrentReportCount(user.reportApprovalCount || 0);
    } else {
      cleanupWebSocket();
      setCurrentReportCount(0);
    }

    return cleanupWebSocket;
  }, [user?.id, setupWebSocket, cleanupWebSocket]);

  // Monitor user's report count changes from store
  useEffect(() => {
    if (!user) return;

    const reportCount = user.reportApprovalCount || 0;
    setCurrentReportCount(reportCount);

    // Check thresholds on mount and when user data changes
    if (shouldAutoLogout(reportCount)) {
      const logoutMessage = getLogoutMessage(reportCount);
      if (logoutMessage) {
        handleAutomaticLogout(reportCount, logoutMessage);
      }
    }
  }, [user?.reportApprovalCount, handleAutomaticLogout]);

  return {
    currentReportCount,
    isWebSocketConnected,
    // Utility functions for external use
    getReportStatus,
    getReportThresholds: () => REPORT_THRESHOLDS,
  };
};
