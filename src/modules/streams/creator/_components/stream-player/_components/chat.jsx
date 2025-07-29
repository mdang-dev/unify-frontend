import { useMediaQuery } from '@/src/hooks/use-media-query';
import { ChatVariant, useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { useChat, useConnectionState, useRemoteParticipant } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useMemo } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import ChatHeader, { ChatHeaderSkeleton } from './chat-header';
import ChatForm, { ChatFormSkeleton } from './chat-form';
import ChatList, { ChatListSkeleton } from './chat-list';
import ChatCommunity from './chat-community';

export default function Chat({
  viewerName,
  hostName,
  hostIdentity,
  isFollowing,
  isChatEnabled,
  isChatDelayed,
  isChatFollowersOnly,
}) {
  const { variant } = useChatSidebarStore((state) => state);
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);

  const isOnline = participant && connectionState === ConnectionState.Connected;
  const isHidden = isChatEnabled || !isOnline;

  const [value, setValue] = useState('');
  const { chatMessages: messages, send } = useChat();

  const reversedMessages = useMemo(() => {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);

  const onSubmit = () => {
    if (!send) return;
    send(value);
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
            onSubmit={onSubmit}
            value={value}
            isHidden={isHidden}
            onChange={onChange}
            isFollowersOnly={isChatFollowersOnly}
            isDelayed={isChatDelayed}
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
