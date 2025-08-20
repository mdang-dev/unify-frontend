import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    if (!token) {
      setError('Authentication token missing');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsUrl = `${apiUrl}/ws?token=${encodeURIComponent(token)}`; // token fallback for SockJS

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      onConnect: () => {
        setConnected(true);
        setError(null);
        console.log('WebSocket connected');
      },
      onStompError: (frame) => {
        setError(frame.headers.message || 'STOMP error');
      },
      onWebSocketError: (evt) => {
        setError(evt.message || 'WebSocket error');
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current?.deactivate();
    };
  }, []);

  return { connected, error, client: clientRef.current };
};
