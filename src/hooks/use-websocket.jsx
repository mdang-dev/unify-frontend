import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useWebSocket = (userId) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const stompClient = new Client({
      webSocketFactory: () =>
        new SockJS(
          `${process.env.NEXT_PUBLIC_API_URL}/ws?token=` + getCookie(COOKIE_KEYS.AUTH_TOKEN)
        ),
      connectHeaders: {
        userId,
      },
      debug: (str) => console.log('STOMP Debug:', str),
      onConnect: () => {
        console.log('WebSocket Connected');
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;
    setClient(stompClient);

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [userId]);

  return { client, connected };
};
