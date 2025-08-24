import { useEffect } from 'react';
import { useSocket } from './use-socket';
import { useStreamSettingsStore } from '@/src/stores/stream-settings.store';

export const useRealtimeChatSettings = (streamId) => {
  const { client: socketClient } = useSocket();
  const { streamSettings, subscribeToStream, clearStreamSettings } = useStreamSettingsStore();
  
  // Subscribe to real-time stream updates using the correct topic
  useEffect(() => {
    if (!socketClient || !streamId) return;
    
    console.log('Subscribing to real-time chat settings for stream:', streamId);
    const subscription = subscribeToStream(streamId, streamId);
    
    return () => {
      if (subscription) {
        console.log('Unsubscribing from real-time chat settings for stream:', streamId);
        subscription.unsubscribe();
      }
      clearStreamSettings(streamId);
    };
  }, [socketClient, streamId, subscribeToStream, clearStreamSettings]);

  // Get current chat settings with fallback to default values
  const getChatSettings = (defaultSettings = {}) => {
    const socketSettings = streamSettings[streamId] || {};
    
    return {
      isChatEnabled: socketSettings.isChatEnabled ?? defaultSettings.isChatEnabled ?? true,
      isChatDelayed: socketSettings.isChatDelayed ?? defaultSettings.isChatDelayed ?? false,
      isChatFollowersOnly: socketSettings.isChatFollowersOnly ?? defaultSettings.isChatFollowersOnly ?? false,
    };
  };

  return {
    getChatSettings,
    streamSettings: streamSettings[streamId] || {},
  };
};
