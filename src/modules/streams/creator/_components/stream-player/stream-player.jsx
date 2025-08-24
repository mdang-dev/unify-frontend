'use client';

import { useViewerToken } from '@/src/hooks/use-viewer-token';
import { LiveKitRoom } from '@livekit/components-react';
import Video, { VideoSkeleton } from './_components/video';
import { useChatSidebarStore } from '@/src/stores/chat-sidebar.store';
import { cn } from '@/src/lib/utils';
import Chat, { ChatSkeleton } from './_components/chat';
import ChatToggle from './_components/chat-toggle';
import Header from './_components/header';
import { useState, useEffect, useRef } from 'react';
import { ButtonCommon } from '@/src/components/button';
import { Edit, Settings } from 'lucide-react';
import EditStreamModal from './_components/edit-stream-modal';
import { useAuthStore } from '@/src/stores/auth.store';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { useFollow } from '@/src/hooks/use-follow';
import { useStreamSettings } from '@/src/hooks/use-stream-settings';
import { useStreamSettingsStore } from '@/src/stores/stream-settings.store';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';

export default function StreamPlayer({ externalUser, user, stream, currentUserId }) {
  const t = useTranslations('Streams');
  const { token, name, identity } = useViewerToken(user?.id, externalUser?.id);
  const { collapsed } = useChatSidebarStore((state) => state);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const { isFollowing } = useFollow(currentUserId, user?.id);
  const queryClient = useQueryClient();
  
    // Real-time stream settings
  const { streamSettings, initializeStreamSettings, isConnected } = useStreamSettings(
    stream?.id || user?.id, 
    currentUserId
  );
  
  // Initialize stream settings with current values
  const initializedRef = useRef(false);
  useEffect(() => {
    if (stream && Object.keys(stream).length > 0 && !initializedRef.current) {
      const currentSettings = {
        isChatEnabled: stream.isChatEnabled,
        isChatDelayed: stream.isChatDelayed,
        isChatFollowersOnly: stream.isChatFollowersOnly,
      };
      
      initializeStreamSettings(currentSettings);
      initializedRef.current = true;
    }
  }, [stream?.id, stream?.isChatEnabled, stream?.isChatDelayed, stream?.isChatFollowersOnly, initializeStreamSettings]);

  // State to track if edit modal was just closed to refresh data
  const [shouldRefreshData, setShouldRefreshData] = useState(false);

  // Fetch stream details using the same query key as the modal
  const { data: streamDetails, isLoading: isLoadingStreamDetails } = useQuery({
    queryKey: [QUERY_KEYS.STREAM_DETAILS, user?.id],
    queryFn: () => streamsQueryApi.getStreamDetails(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refresh data when edit modal closes
  useEffect(() => {
    if (shouldRefreshData) {
      // Force a refresh of the stream data using the same query key as the modal
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STREAM_DETAILS, user?.id] });
      setShouldRefreshData(false);
    }
  }, [shouldRefreshData, queryClient, user?.id]);

  // Log stream details changes for debugging
  useEffect(() => {
    if (streamDetails) {
      console.log('Stream details updated:', {
        title: streamDetails.title,
        description: streamDetails.description,
        thumbnailUrl: streamDetails.thumbnailUrl
      });
    }
  }, [streamDetails]);

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
            <div>
              <Video hostIdentity={user?.id} hostName={user?.username} />
              <div className="mb-2">
                <Header
                  hostName={user?.username}
                  hostIdentity={user?.id}
                  viewerIdentity={identity}
                  imageUrl={user?.avatar?.url}
                  currentUserId={currentUserId}
                  name={streamDetails?.title || stream?.name}
                  description={streamDetails?.description || stream?.description}
                  isLoading={isLoadingStreamDetails}
                />
              </div>

              {/* Edit Stream Card - Only show for the stream owner */}
              {currentUser?.id === user?.id && (
                <div className="mx-4 mt-6 mb-2 p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
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
                    <div className="flex items-center gap-3">
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
                  
                  {/* Current Stream Info Preview */}
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    {/* Title */}
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 mt-1 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Title</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {streamDetails?.title || stream?.name || 'Untitled Stream'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 mt-1 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm text-foreground line-clamp-2">
                          {streamDetails?.description || stream?.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Thumbnail */}
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 mt-1 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Thumbnail</p>
                        {streamDetails?.thumbnailUrl || stream?.thumbnailUrl ? (
                          <div className="relative">
                            <img 
                              src={streamDetails?.thumbnailUrl || stream?.thumbnailUrl} 
                              alt="Stream thumbnail"
                              className="w-20 h-12 object-cover rounded-md border border-border"
                            />
                            <div className="absolute inset-0 rounded-md" />
                          </div>
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded-md border border-dashed border-border flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No thumbnail</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Stream Modal */}
              <EditStreamModal
                isOpen={isEditModalOpen}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setShouldRefreshData(true);
                }}
                currentTitle={streamDetails?.title || stream?.name || ''}
                currentDescription={streamDetails?.description || stream?.description || ''}
                currentThumbnailUrl={streamDetails?.thumbnailUrl || stream?.thumbnailUrl || ''}
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
                      
                      {/* Description Skeleton */}
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-20 w-full bg-muted animate-pulse rounded" />
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
                  stream={stream}
                  isChatEnabled={streamSettings.isChatEnabled ?? stream?.isChatEnabled}
                  isChatDelayed={streamSettings.isChatDelayed ?? stream?.isChatDelayed}
                  isChatFollowersOnly={streamSettings.isChatFollowersOnly ?? stream?.isChatFollowersOnly}
                  isFollowing={isFollowing}
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
