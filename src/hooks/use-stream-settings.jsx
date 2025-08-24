import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from './use-socket';
import { useStreamSettingsStore } from '@/src/stores/stream-settings.store';

export const useStreamSettings = (streamId, userId) => {
  const { connected, client } = useSocket();
  const subscriptionRef = useRef(null);
  
  const {
    setConnection,
    subscribeToStream,
    clearStreamSettings,
    getStreamSettings,
    setStreamSettings,
  } = useStreamSettingsStore();

  // Update connection state in store
  useEffect(() => {
    setConnection(connected, client);
  }, [connected, client]);

  // Subscribe to stream updates when connected
  useEffect(() => {
    if (!connected || !client || !streamId || !userId) {
      return;
    }

    // Subscribe to stream settings updates
    subscriptionRef.current = subscribeToStream(streamId, userId);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [connected, client, streamId, userId, subscribeToStream]);

  // Cleanup when leaving stream
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      clearStreamSettings(streamId);
    };
  }, [streamId, clearStreamSettings]);

  // Initialize stream settings if not already set
  const initializeStreamSettings = useCallback((initialSettings) => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      setStreamSettings(streamId, initialSettings);
    }
  }, [streamId, setStreamSettings]);

  // Get current stream settings
  const streamSettings = getStreamSettings(streamId);

  return {
    streamSettings,
    initializeStreamSettings,
    isConnected: connected,
  };
};
