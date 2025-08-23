'use client';

import { useViewerToken } from '@/src/hooks/use-viewer-token';
import { LiveKitRoom } from '@livekit/components-react';
import Video, { VideoSkeleton } from './_components/video';
import { useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { cn } from '@/src/lib/utils';
import Chat, { ChatSkeleton } from './_components/chat';
import ChatToggle from './_components/chat-toggle';
import Header from './_components/header';
import { useState } from 'react';
import { ButtonCommon } from '@/src/components/button';
import { Edit, Settings } from 'lucide-react';
import EditStreamModal from './_components/edit-stream-modal';
import { useAuthStore } from '@/src/stores/auth.store';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/src/components/ui/scroll-area';

export default function StreamPlayer({ externalUser, user, stream, currentUserId }) {
  const t = useTranslations('Streams');
  const { token, name, identity } = useViewerToken(user?.id, externalUser?.id);
  const { collapsed } = useChatSidebarStore((state) => state);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

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
        <div className={cn('flex-1', !collapsed && 'lg:pr-[350px]')}>
          <ScrollArea className={cn('h-full', !collapsed && 'scrollbar-none')}>
            <div className="space-y-4">
              <Video hostIdentity={user?.id} hostName={user?.username} />
              <div className="mb-4">
                <Header
                  hostName={user?.username}
                  hostIdentity={user?.id}
                  viewerIdentity={identity}
                  imageUrl={user?.avatar?.url}
                  currentUserId={currentUserId}
                  name={stream?.name}
                />
              </div>

              {/* Edit Stream Card - Only show for the stream owner */}
              {currentUser?.id === user?.id && (
                <div className="mx-4 mt-6 p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{t('StreamSettings')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('UpdateStreamTitleThumbnail')}
                        </p>
                      </div>
                    </div>
                    <ButtonCommon
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {t('EditStream')}
                    </ButtonCommon>
                  </div>
                </div>
              )}

              {/* Edit Stream Modal */}
              <EditStreamModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentTitle={stream?.name || ''}
                currentThumbnailUrl={stream?.thumbnailUrl || ''}
                userId={user?.id}
              />

              {/* Edit Stream Modal Loading Skeleton - Show when modal is open but loading */}
              {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="w-full max-w-md mx-4 bg-card border border-border rounded-lg p-6">
                    <div className="space-y-4">
                      {/* Title Skeleton */}
                      <div className="space-y-2">
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded" />
                      </div>
                      
                      {/* Thumbnail Skeleton */}
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-32 w-full bg-muted animate-pulse rounded-lg" />
                        <div className="h-20 w-full bg-muted animate-pulse rounded-lg border-2 border-dashed border-border" />
                      </div>
                      
                      {/* Buttons Skeleton */}
                      <div className="flex justify-end space-x-2 pt-4">
                        <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {!collapsed && (
          <>
            <div className="fixed right-0 top-0 z-40 hidden h-full w-[350px] border-l border-border bg-background lg:block">
              <Chat
                viewerName={name}
                hostName={user?.username}
                hostIdentity={user?.id}
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
      <div className={cn('flex-1', !collapsed && 'lg:pr-[350px]')}>
        <ScrollArea className={cn('h-full', !collapsed && 'scrollbar-none')}>
          <div className="space-y-0">
            <VideoSkeleton />

            <div className="mt-4 h-16 w-full animate-pulse border-t border-border bg-muted/40" />
            <div className="mx-4 mt-2 h-10 w-2/3 animate-pulse rounded-md bg-muted/30" />
          </div>
        </ScrollArea>
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
