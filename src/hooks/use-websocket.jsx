import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useWebSocket = (userId) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef(null);

  const createStompClient = useCallback(async () => {
    if (!userId) return null;

    const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    if (!token) {
      setError('Authentication token not found');
      return null;
    }

    // Fetch CSRF token for WebSocket connection
    let csrfToken = null;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/auth/csrf`, {
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
      console.warn('Failed to fetch CSRF token:', error);
      // Continue without CSRF token if fetch fails
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsUrl = `${apiUrl}/ws?token=${token}`;
    
    console.log('Creating WebSocket connection:', wsUrl);
    
    return new Client({
      webSocketFactory: () => {
        return new SockJS(wsUrl, null, {
          transports: ['websocket'], // ✅ PERFORMANCE: Prefer WebSocket only for better performance
          timeout: 10000, // ✅ PERFORMANCE: Reduced timeout for faster connection
          heartbeat: 15000, // ✅ PERFORMANCE: Optimized heartbeat interval
        });
      },
      connectHeaders: {
        userId,
        token: token,
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
      },
      // ✅ PERFORMANCE: Optimized heartbeat settings
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('STOMP Debug:', str);
        }
      },
      // ✅ PERFORMANCE: Optimized connection settings
      reconnectDelay: 3000, // Faster reconnection
      maxWebSocketFrameSize: 16 * 1024, // 16KB frame size
      onConnect: () => {
        console.log('✅ WebSocket Connected Successfully');
        setConnected(true);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on successful connection
      },
      onDisconnect: () => {
        console.log('❌ WebSocket Disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame);
        setError(`STOMP Error: ${frame.headers.message || 'Connection failed'}`);
        setConnected(false);
        
        // Retry logic for STOMP errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
          console.log(`🔄 Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          
          retryTimeoutRef.current = setTimeout(async () => {
            if (clientRef.current) {
              clientRef.current.deactivate();
            }
            const newClient = await createStompClient();
            if (newClient) {
              newClient.activate();
            }
          }, delay);
        }
      },
      onWebSocketError: (event) => {
        console.error('❌ WebSocket Error:', event);
        setError(`WebSocket Error: ${event.message || 'Connection failed'}`);
        setConnected(false);
        
        // Retry logic for WebSocket errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          console.log(`🔄 Retrying WebSocket connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          
          retryTimeoutRef.current = setTimeout(async () => {
            if (clientRef.current) {
              clientRef.current.deactivate();
            }
            const newClient = await createStompClient();
            if (newClient) {
              newClient.activate();
            }
          }, delay);
        }
      },
      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket Closed:', event);
        setConnected(false);
        
        // Only retry if it's not a normal closure
        if (event.code !== 1000 && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          console.log(`🔄 Retrying after WebSocket close in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          
          retryTimeoutRef.current = setTimeout(async () => {
            const newClient = await createStompClient();
            if (newClient) {
              newClient.activate();
            }
          }, delay);
        }
      },
      // Disable automatic reconnection to use our custom retry logic
      reconnectDelay: 0,
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setConnected(false);
      setError(null);
      return;
    }

    const initializeWebSocket = async () => {
      const stompClient = await createStompClient();
      if (stompClient) {
        clientRef.current = stompClient;
        setClient(stompClient);
        
        try {
          stompClient.activate();
        } catch (err) {
          console.error('Error activating WebSocket client:', err);
          setError(`Failed to connect: ${err.message}`);
        }
      }
    };

    initializeWebSocket();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch (err) {
          console.error('Error deactivating WebSocket client:', err);
        }
      }
    };
  }, [userId, createStompClient]);

  const manualReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryCountRef.current = 0;
    setError(null);
    
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (err) {
        console.error('Error deactivating during manual reconnect:', err);
      }
    }
    
    const newClient = createStompClient();
    if (newClient) {
      clientRef.current = newClient;
      setClient(newClient);
      newClient.activate();
    }
  }, [createStompClient]);

  return {
    client,
    connected,
    error,
    reconnect: manualReconnect,
  };
};
