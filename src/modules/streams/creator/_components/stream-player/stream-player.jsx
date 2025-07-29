'use client';

import { useViewerToken } from '@/src/hooks/use-viewer-token';
import { LiveKitRoom } from '@livekit/components-react';
import Video, { VideoSkeleton } from './_components/video';
import { useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { cn } from '@/src/lib/utils';
import Chat, { ChatSkeleton } from './_components/chat';
import ChatToggle from './_components/chat-toggle';
import Header from './_components/header';

export default function StreamPlayer({ externalUser, user, stream, isFollowing }) {
  const { token, name, identity } = useViewerToken(user?.id, externalUser?.id);
  const { collapsed } = useChatSidebarStore((state) => state);

  if (!token || !name || !identity) {
    return <StreamPlayerSkeleton />;
  }
  return (
    <>
      {collapsed && (
        <div className="fixed right-2 top-[10px] z-50 block">
          <ChatToggle />
        </div>
      )}
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        className="relative flex h-full flex-col lg:flex-row"
      >
        <div className={cn('flex-1 overflow-y-auto', !collapsed && 'lg:pr-[350px]')}>
          <Video hostIdentity={user?.id} hostName={user?.username} />
          <Header
            hostName={user?.username}
            hostIdentity={user?.id}
            viewerIdentity={identity}
            imageUrl={user?.avatar?.url}
            isFollowing={isFollowing}
            name={stream?.name}
          />
        </div>

        {!collapsed && (
          <>
            <div className="fixed right-0 top-0 z-40 hidden h-full w-[350px] border-l border-border bg-background lg:block">
              <Chat
                viewerName={name}
                hostName={user?.username}
                hostIdentity={user?.id}
                isFollowing={isFollowing}
                isChatEnabled={stream?.isChatEnabled}
                isChatDelayed={stream?.isChatDelayed}
                isChatFollowersOnly={stream?.isChatFollowersOnly}
              />
            </div>
          </>
        )}
      </LiveKitRoom>
    </>
  );
}

export const StreamPlayerSkeleton = () => {
  const { collapsed } = useChatSidebarStore.getState();

  return (
    <div className="relative flex h-full flex-col lg:flex-row">
      {/* Video Skeleton */}
      <div className={cn('flex-1 overflow-y-auto', !collapsed && 'lg:pr-[350px]')}>
        <VideoSkeleton />

        <div className="mt-4 h-16 w-full animate-pulse border-t border-border bg-muted/40" />
        <div className="mx-4 mt-2 h-10 w-2/3 animate-pulse rounded-md bg-muted/30" />
      </div>

      {/* Chat Skeleton */}
      {!collapsed && (
        <div className="fixed right-0 top-0 z-40 hidden h-full w-[350px] border-l border-border bg-background lg:block">
          <ChatSkeleton />
        </div>
      )}
    </div>
  );
};
