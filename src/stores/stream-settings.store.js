import { create } from 'zustand';
import { toast } from 'sonner';

export const useStreamSettingsStore = create((set, get) => ({
  // Stream settings state
  streamSettings: {},
  
  // Real-time updates
  isConnected: false,
  socketClient: null,
  lastToastTime: {}, // Track last toast time per stream to prevent duplicates
  
  // Actions
  setStreamSettings: (streamId, settings) => {
    set((state) => {
      
      const currentSettings = state.streamSettings[streamId] || {};
      const newSettings = { ...currentSettings, ...settings };
      
      // Only update if settings actually changed
      if (JSON.stringify(currentSettings) === JSON.stringify(newSettings)) {
        return state; // No change needed
      }
      
      return {
        streamSettings: {
          ...state.streamSettings,
          [streamId]: newSettings,
        },
      };
    });
  },
  
  updateChatSettings: (streamId, chatSettings) => {
    set((state) => {
      const currentSettings = state.streamSettings[streamId] || {};
      
      const newSettings = {
        ...currentSettings,
        isChatEnabled: chatSettings.isChatEnabled,
        isChatDelayed: chatSettings.isChatDelayed,
        isChatFollowersOnly: chatSettings.isChatFollowersOnly,
      };
      
      // Only update if settings actually changed
      if (JSON.stringify(currentSettings) === JSON.stringify(newSettings)) {
        return state; // No change needed
      }
      
      console.log('Updating chat settings for stream', streamId, ':', {
        from: currentSettings,
        to: newSettings
      });
      
      return {
        streamSettings: {
          ...state.streamSettings,
          [streamId]: newSettings,
        },
      };
    });
  },
  
  // WebSocket connection
  setConnection: (connected, client) => {
    set({ isConnected: connected, socketClient: client });
    
    // If connection is lost, clear any active subscriptions
    if (!connected) {
      console.log('WebSocket connection lost, clearing stream settings');
      set({ streamSettings: {} });
    }
  },

  // Check if connection is ready for subscriptions
  isConnectionReady: () => {
    const { socketClient, isConnected } = get();
    return socketClient && isConnected && socketClient.connected;
  },
  
  // Subscribe to stream updates
  subscribeToStream: (streamId, userId) => {
    if (!get().isConnectionReady() || !userId) {
      console.log('Cannot subscribe to stream: connection not ready or user not authenticated');
      return null;
    }
    
    try {
      // Subscribe to stream-specific updates
      console.log('Subscribing to WebSocket topic:', `/topic/streams/${streamId}/settings`);
      const subscription = get().socketClient.subscribe(`/topic/streams/${streamId}/settings`, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('Stream settings update received for stream', streamId, ':', data);
          console.log('Current settings before update:', get().streamSettings[streamId] || {});
          
          if (data.type === 'CHAT_SETTINGS_UPDATE') {
            // Get current settings BEFORE updating
            const currentSettings = get().streamSettings[streamId] || {};
            const { isChatEnabled, isChatDelayed, isChatFollowersOnly } = data.settings;
            
            // Check if this is a real change from current state
            const hasChanged = currentSettings.isChatEnabled !== isChatEnabled || 
                              currentSettings.isChatDelayed !== isChatDelayed || 
                              currentSettings.isChatFollowersOnly !== isChatFollowersOnly;
            
            // Update the settings
            get().updateChatSettings(streamId, data.settings);
            
            // Only show toast if there was an actual change and enough time has passed
            if (hasChanged) {
              const now = Date.now();
              const lastToast = get().lastToastTime[streamId] || 0;
              const timeSinceLastToast = now - lastToast;
              
              // Only show toast if at least 2 seconds have passed since last toast
              if (timeSinceLastToast > 2000) {
                let message = 'Chat settings updated: ';
                if (!isChatEnabled) {
                  message += 'Chat disabled';
                } else {
                  const updates = [];
                  if (isChatDelayed) updates.push('delayed');
                  if (isChatFollowersOnly) updates.push('followers only');
                  if (updates.length > 0) {
                    message += updates.join(', ');
                  } else {
                    message += 'enabled for everyone';
                  }
                }
                
                toast.info(message, { duration: 3000, position: 'top-right' });
                
                // Update last toast time
                set((state) => ({
                  lastToastTime: {
                    ...state.lastToastTime,
                    [streamId]: now,
                  },
                }));
              }
            }
          } else if (data.type === 'STREAM_UPDATE') {
            get().setStreamSettings(streamId, data.settings);
            // Only show toast for stream updates if they're significant
          }
        } catch (error) {
          console.error('Error parsing stream settings update:', error);
        }
      });
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to stream settings:', error);
      return null;
    }
  },
  
  // Get current settings for a stream
  getStreamSettings: (streamId) => {
    return get().streamSettings[streamId] || {};
  },
  
  // Force update settings (for user-initiated changes)
  forceUpdateSettings: (streamId, settings) => {
    set((state) => ({
      streamSettings: {
        ...state.streamSettings,
        [streamId]: {
          ...state.streamSettings[streamId],
          ...settings,
        },
      },
    }));
  },
  
  // Clear settings when leaving stream
  clearStreamSettings: (streamId) => {
    set((state) => {
      const newSettings = { ...state.streamSettings };
      delete newSettings[streamId];
      return { streamSettings: newSettings };
    });
  },
}));
