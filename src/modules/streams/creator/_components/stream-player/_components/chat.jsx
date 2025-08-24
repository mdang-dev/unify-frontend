import { ChatVariant, useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { useChat, useConnectionState, useRemoteParticipant } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useMemo, useEffect } from 'react';
import { useState } from 'react';
import { useRealtimeChatSettings } from '@/src/hooks/use-realtime-chat-settings';
import ChatHeader, { ChatHeaderSkeleton } from './chat-header';
import ChatForm, { ChatFormSkeleton } from './chat-form';
import ChatList, { ChatListSkeleton } from './chat-list';
import ChatCommunity from './chat-community';

export default function Chat({
  viewerName,
  hostName,
  hostIdentity,
  stream,
  isFollowing,
  isChatEnabled,
  isChatDelayed,
  isChatFollowersOnly,
}) {
  const { variant } = useChatSidebarStore((state) => state);
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  
  // Real-time chat settings - use streamId for WebSocket subscription
  const { getChatSettings } = useRealtimeChatSettings(stream?.id || hostIdentity);
  
  const isOnline = participant && connectionState === ConnectionState.Connected;
  
  // Get chat settings with fallback to props
  const chatSettings = getChatSettings({
    isChatEnabled,
    isChatDelayed,
    isChatFollowersOnly,
  });
  
  const isHidden = !chatSettings.isChatEnabled || !isOnline;
  
  // Debug: Log chat settings
  console.log('Chat Settings:', {
    props: { isChatEnabled, isChatDelayed, isChatFollowersOnly },
    final: chatSettings,
    isHidden,
    hostIdentity,
    streamId: stream?.id
  });

  const [value, setValue] = useState('');
  const { chatMessages: messages, send } = useChat();

  const reversedMessages = useMemo(() => {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);

  const handleSubmit = (message = value) => {
    if (!send) return;
    send(message);
    setValue('');
  };

  const onChange = (value) => {
    setValue(value);
  };

  return (
    <div className="flex h-full w-full max-w-sm flex-col border-l-[0.5px] border-neutral-700 bg-background pt-0">
            <ChatHeader />
      {variant === ChatVariant.CHAT && (
                    <>
              <ChatList messages={reversedMessages} isHidden={isHidden} />
              <ChatForm
                onSubmit={handleSubmit}
                value={value}
                isHidden={isHidden}
                onChange={onChange}
                isFollowersOnly={chatSettings.isChatFollowersOnly}
                isDelayed={chatSettings.isChatDelayed}
                isFollowing={isFollowing}
              />
            </>
      )}
      {variant === ChatVariant.COMMUNITY && (
        <ChatCommunity viewerName={viewerName} hostName={hostName} isHidden={isHidden} />
      )}
    </div>
  );
}

export const ChatSkeleton = () => {
  return (
    <div className="flex h-[calc(100vh-80px)] flex-col border-b border-l pt-0">
      <ChatHeaderSkeleton />
      <ChatListSkeleton />
      <ChatFormSkeleton />
    </div>
  );
};
