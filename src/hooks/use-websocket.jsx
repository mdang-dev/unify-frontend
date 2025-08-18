import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

// ✅ NEW: Global connection pool for better resource management
const globalConnectionPool = new Map();
const MAX_CONNECTIONS_PER_USER = 3;
const MAX_TOTAL_CONNECTIONS = 10;

export const useWebSocket = (userId) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // ✅ NEW: Connection pooling logic
  const getConnectionFromPool = useCallback((channel) => {
    const poolKey = `${userId}:${channel}`;
    
    if (globalConnectionPool.has(poolKey)) {
      const connection = globalConnectionPool.get(poolKey);
      if (connection && connection.connected) {
        return connection;
      } else {
        // Remove stale connection
        globalConnectionPool.delete(poolKey);
      }
    }
    
    // Check if we can create new connection
    if (globalConnectionPool.size >= MAX_TOTAL_CONNECTIONS) {
      // Close oldest connection
      const oldestKey = globalConnectionPool.keys().next().value;
      const oldestConnection = globalConnectionPool.get(oldestKey);
      try {
        oldestConnection?.deactivate();
      } catch (err) {
        // Ignore cleanup errors
      }
      globalConnectionPool.delete(oldestKey);
    }
    
    return null; // Will create new connection
  }, [userId]);

  const addConnectionToPool = useCallback((channel, connection) => {
    const poolKey = `${userId}:${channel}`;
    globalConnectionPool.set(poolKey, connection);
  }, [userId]);

  const removeConnectionFromPool = useCallback((channel) => {
    const poolKey = `${userId}:${channel}`;
    globalConnectionPool.delete(poolKey);
  }, [userId]);

  const createStompClient = useCallback(async (channel = 'default') => {
    if (!userId) return null;

    // ✅ OPTIMIZED: Check connection pool first
    const existingConnection = getConnectionFromPool(channel);
    if (existingConnection) {
      return existingConnection;
    }

    const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    if (!token) {
      setError('Authentication token not found');
      return null;
    }

    // ✅ OPTIMIZED: Create new AbortController for each request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Fetch CSRF token for WebSocket connection with better error handling
    let csrfToken = null;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const timeoutId = setTimeout(() => abortControllerRef.current.abort(), 3000); // ✅ OPTIMIZED: Reduced timeout to 3 seconds

      const response = await fetch(`${apiUrl}/auth/csrf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        csrfToken = data.token;
      } else {
        // Log specific error for debugging
        if (process.env.NODE_ENV === 'development') {
          console.warn(`CSRF token fetch failed with status: ${response.status}`);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (error.name === 'AbortError') {
          console.warn('CSRF token fetch timed out');
        } else {
          console.warn('Failed to fetch CSRF token:', error.message);
        }
      }
      // Continue without CSRF token if fetch fails
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsUrl = `${apiUrl}/ws`;

    // Create STOMP client with optimized settings for real-time communication
    const newClient = new Client({
      webSocketFactory: () => {
        return new SockJS(wsUrl);
      },
      connectHeaders: {
        userId,
        token: `Bearer ${token}`,
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
      },
      // ✅ OPTIMIZED: Balanced heartbeat settings for stability
      heartbeatIncoming: 25000, // Increased for better stability
      heartbeatOutgoing: 25000, // Increased for better stability
      debug: (str) => {
        // Remove debug logging - not needed in production
      },
      // ✅ OPTIMIZED: Balanced connection settings
      reconnectDelay: 0, // Disable auto-reconnect to use custom logic
      maxWebSocketFrameSize: 8 * 1024, // ✅ OPTIMIZED: 8KB frame size for better performance
      onConnect: () => {
        setConnected(true);
        setError(null);
        retryCountRef.current = 0;
        reconnectAttemptsRef.current = 0;
        
        // ✅ NEW: Add to connection pool when connected
        addConnectionToPool(channel, newClient);
      },
      onDisconnect: () => {
        // WebSocket disconnected - update connection state
        setConnected(false);
        
        // ✅ NEW: Remove from connection pool when disconnected
        removeConnectionFromPool(channel);
      },
      onStompError: (frame) => {
        // Only log critical STOMP errors
        setError(`STOMP Error: ${frame.headers.message || 'Connection failed'}`);
        setConnected(false);

        // ✅ OPTIMIZED: Clear existing timeout before setting new one
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        if (retryCountRef.current < maxRetries && reconnectAttemptsRef.current < maxReconnectAttempts) {
          retryCountRef.current++;
          reconnectAttemptsRef.current++;
          const delay = Math.min(Math.pow(2, retryCountRef.current) * 1000, 8000); // ✅ OPTIMIZED: Cap at 8 seconds

          retryTimeoutRef.current = setTimeout(async () => {
            if (clientRef.current) {
              try {
                clientRef.current.deactivate();
              } catch (err) {
                // Ignore deactivation errors
              }
            }
            const newClient = await createStompClient();
            if (newClient) {
              try {
                newClient.activate();
              } catch (err) {
                // Only log critical activation errors
                console.error('Failed to activate new client:', err.message);
              }
            }
          }, delay);
        }
      },
      onWebSocketError: (event) => {
        // Only log critical WebSocket errors
        setError(`WebSocket Error: ${event.message || 'Connection failed'}`);
        setConnected(false);

        // ✅ OPTIMIZED: Clear existing timeout before setting new one
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        // Implement exponential backoff retry strategy for WebSocket errors
        if (retryCountRef.current < maxRetries && reconnectAttemptsRef.current < maxReconnectAttempts) {
          retryCountRef.current++;
          reconnectAttemptsRef.current++;
          const delay = Math.min(Math.pow(2, retryCountRef.current) * 1000, 8000); // ✅ OPTIMIZED: Cap at 8 seconds

          retryTimeoutRef.current = setTimeout(async () => {
            if (clientRef.current) {
              try {
                clientRef.current.deactivate();
              } catch (err) {
                // Ignore deactivation errors
              }
            }
            const newClient = await createStompClient();
            if (newClient) {
              try {
                newClient.activate();
              } catch (err) {
                // Only log critical activation errors
                console.error('Failed to activate new client:', err.message);
              }
            }
          }, delay);
        }
      },
      onWebSocketClose: (event) => {
        // WebSocket connection closed - update connection state
        setConnected(false);

        // ✅ OPTIMIZED: Clear existing timeout before setting new one
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        // Only retry reconnection if it's not a normal closure (code 1000 = normal close)
        if (event.code !== 1000 && retryCountRef.current < maxRetries && reconnectAttemptsRef.current < maxReconnectAttempts) {
          retryCountRef.current++;
          reconnectAttemptsRef.current++;
          const delay = Math.min(Math.pow(2, retryCountRef.current) * 1000, 8000); // ✅ OPTIMIZED: Cap at 8 seconds

          retryTimeoutRef.current = setTimeout(async () => {
            const newClient = await createStompClient();
            if (newClient) {
              try {
                newClient.activate();
              } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to activate new client:', err.message);
                }
              }
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
          // Only log critical activation errors
          console.error('Error activating WebSocket client:', err);
          setError(`Failed to connect: ${err.message}`);
        }
      }
    };

    initializeWebSocket();

    return () => {
      // ✅ OPTIMIZED: Cleanup all timeouts and controllers
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch (err) {
          // Ignore cleanup errors
        }
        clientRef.current = null;
      }
    };
  }, [userId, createStompClient]);

  const manualReconnect = useCallback(() => {
    // ✅ OPTIMIZED: Clear existing timeout before reconnecting
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    retryCountRef.current = 0;
    reconnectAttemptsRef.current = 0;
    setError(null);

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (err) {
        // Ignore deactivation errors
      }
    }

    const newClient = createStompClient();
    if (newClient) {
      clientRef.current = newClient;
      setClient(newClient);
      try {
        newClient.activate();
      } catch (err) {
        // Only log critical activation errors
        console.error('Failed to activate client during manual reconnect:', err.message);
      }
    }
  }, [createStompClient]);

  return {
    client,
    connected,
    error,
    reconnect: manualReconnect,
    // ✅ NEW: Connection pooling methods
    getConnection: getConnectionFromPool,
    addConnection: addConnectionToPool,
    removeConnection: removeConnectionFromPool,
    poolSize: globalConnectionPool.size,
  };
};
