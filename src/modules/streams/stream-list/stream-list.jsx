'use client';

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import { Settings, Eye } from 'lucide-react';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';
import { useAuthStore } from '@/src/stores/auth.store';
import { ButtonCommon } from '@/src/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle } from '@/src/components/ui/dialog';
import { Skeleton } from '@/src/components/ui/skeleton';
import FollowingLiveList from './_components/following-live-list';
import StreamCard from './_components/stream-card';
import StreamCardSkeleton from './_components/stream-card-skeleton';
import StreamKeysModal from './_components/stream-keys-modal';
import ChatSettingsModal from './_components/chat-settings-modal';
import SearchBar from './_components/search-bar';
import { useRouter } from 'next/navigation';

export default function StreamList() {
  const t = useTranslations('Streams');
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [client, setClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Local state for user live status
  const [isUserLive, setIsUserLive] = useState(false);
  const [isLiveStatusLoading, setIsLiveStatusLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  // React Query for streams with infinite scroll pagination
  const pageSize = 12; // 12 streams per page (3x4 grid)

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    status,
    error,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.LIVE_STREAMS, user?.id],
    queryFn: ({ pageParam = 0 }) => streamsQueryApi.getLiveStreams({ 
      viewerId: user?.id, 
      page: pageParam, 
      size: pageSize 
    }),
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPageNo + 1 : undefined,
    keepPreviousData: true,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Extract all streams from infinite query
  const allStreams = data?.pages?.flatMap(page => page.data) || [];
  const totalStreams = data?.pages?.[0]?.totalElements || 0;
  const totalPages = data?.pages?.[0]?.totalPages || 0;

  // Intersection observer for auto-loading
  const { ref, inView } = useInView({ threshold: 0.3 });
  
  // Auto-load next page when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Simple loading state for pagination
  const showLoading = isFetchingNextPage;

  // Fetch chat settings
  const { data: chatSettings, isLoading: isLoadingChatSettings } = useQuery({
    queryKey: [QUERY_KEYS.STREAM_CHAT_SETTINGS, user?.id],
    queryFn: () => streamsQueryApi.getChatSettings(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch followed users with live status
  const { data: followingData, isLoading: isLoadingFollowing } = useQuery({
    queryKey: [QUERY_KEYS.FOLLOWED_USERS_IN_LIVE, user?.id],
    queryFn: () => streamsQueryApi.getFollowedUsersWithLiveStatus({ viewerId: user?.id }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Extract followed users data
  const followingUsers = followingData?.data || [];

  // Extract chat settings with defaults
  const enabled = chatSettings?.isChatEnabled ?? true;
  const delayed = chatSettings?.isChatDelayed ?? false;
  const followersOnly = chatSettings?.isChatFollowersOnly ?? false;

  // State setters for chat settings
  const setEnabled = (value) => {
    queryClient.setQueryData([QUERY_KEYS.STREAM_CHAT_SETTINGS, user?.id], (old) => ({
      ...old,
      isChatEnabled: value,
    }));
  };

  const setDelayed = (value) => {
    queryClient.setQueryData([QUERY_KEYS.STREAM_CHAT_SETTINGS, user?.id], (old) => ({
      ...old,
      isChatDelayed: value,
    }));
  };

  const setFollowersOnly = (value) => {
    queryClient.setQueryData([QUERY_KEYS.STREAM_CHAT_SETTINGS, user?.id], (old) => ({
      ...old,
      isChatFollowersOnly: value,
    }));
  };

  // Handle live stream navigation
  const handleLiveStreamClick = () => {
    // router.push(`/streams/${user?.username}`); // Removed as per edit hint
  };

  // Initial live status check
  useEffect(() => {
    if (!user?.id) return;

    // Check initial live status from API
    const checkInitialLiveStatus = async () => {
      try {
        setIsLiveStatusLoading(true);
        const response = await streamsQueryApi.getUserLiveStatus(user.id);
        setIsUserLive(response?.isLive || false);
      } catch (error) {
        console.error('Error checking live status:', error);
        setIsUserLive(false);
      } finally {
        setIsLiveStatusLoading(false);
      }
    };

    checkInitialLiveStatus();
  }, [user?.id]);

  useEffect(() => {
    setClient(true);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Scroll to top function
  const scrollToTop = () => {
    // Try multiple scroll targets for better compatibility
    try {
      // First try scrolling the main element
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Fallback to window scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Scroll to top error:', error);
      // Final fallback - instant scroll
      window.scrollTo(0, 0);
    }
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter streams based on search query
  const filteredStreams = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return allStreams;
    }
    
    const query = debouncedSearchQuery.toLowerCase();
    return allStreams.filter(stream => 
      stream.user?.username?.toLowerCase().includes(query) ||
      stream.title?.toLowerCase().includes(query) ||
      stream.name?.toLowerCase().includes(query)
    );
  }, [allStreams, debouncedSearchQuery]);

  

  if(!client) return null;
  
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <main className="container mx-auto px-10 py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-bold">{t('Title')}</h1>

          <div className="mt-2 flex flex-col justify-center">
            <SearchBar
              placeholder="Search streams by username or title..."
              onSearch={handleSearch}
              isLoading={isLoading}
              className="w-full max-w-lg"
            />
            {/* Search Results Info */}
          </div>

          <div className="flex gap-2">
            {/* Refresh Button */}
            <ButtonCommon
              size="lg"
              variant="outline"
              onClick={() => {
                // Refresh both following data and streams
                queryClient.invalidateQueries([QUERY_KEYS.FOLLOWED_USERS_IN_LIVE, user?.id]);
                queryClient.invalidateQueries([QUERY_KEYS.LIVE_STREAMS, user?.id]);
                refetch();
              }}
              disabled={isLoading || isLoadingFollowing}
              className="flex items-center justify-center p-3"
              title="Refresh"
            >
              <svg 
                className={`h-4 w-4 ${isLoading || isLoadingFollowing ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </ButtonCommon>

            {/* Stream Keys Modal */}
            <Dialog open={isKeysModalOpen} onOpenChange={setIsKeysModalOpen}>
              <DialogTrigger asChild>
                <ButtonCommon size="lg" variant="secondary">
                  {t('StreamKeys')}
                </ButtonCommon>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('StreamKeys')}</DialogTitle>
                </DialogHeader>
                <StreamKeysModal
                  isOpen={isKeysModalOpen}
                  onClose={() => setIsKeysModalOpen(false)}
                />
              </DialogContent>
            </Dialog>

            {/* Chat Settings Button */}
            <ButtonCommon 
              size="lg" 
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('ChatSettings')}
            </ButtonCommon>

            {/* Go to My Stream Button */}
            {user?.username && (
              <ButtonCommon 
                size="lg" 
                variant="outline"
                onClick={() => router.push(`/streams/${user.username}`)}
                className="flex items-center justify-center p-3"
                title="Go to My Stream"
              >
                <svg 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </ButtonCommon>
            )}
          </div>
        </div>

        

        <FollowingLiveList
          followingUsers={followingUsers}
          isLoading={isLoadingFollowing}
          error={null}
        />

        {/* Streams Grid */}
        {isLoading ? (
          <div className="w-full">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <StreamCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">
                Failed to load streams
              </h2>
              <p className="text-muted-foreground mb-4">
                {error?.message || 'Unknown error occurred'}
              </p>
              <ButtonCommon 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Try Again
              </ButtonCommon>
            </div>
          </div>
        ) : allStreams.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {debouncedSearchQuery.trim() ? 'No streams found' : 'No live streams'}
              </h3>
              <p className="text-muted-foreground">
                {debouncedSearchQuery.trim() 
                  ? `No streams found matching "${debouncedSearchQuery}"`
                  : 'There are currently no live streams available.'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Streams Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStreams.map((stream, index) => (
                <StreamCard 
                  key={`${stream.id}-${index}`}
                  stream={stream} 
                />
              ))}
            </div>

            {/* Load More Section */}
            <div ref={ref} className="flex items-center justify-center py-8">
              {showLoading ? (
                <div className="w-full">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <StreamCardSkeleton key={`loading-more-${i}`} />
                    ))}
                  </div>
                </div>
              ) : hasNextPage ? (
                <ButtonCommon
                  size="lg"
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  className="flex items-center gap-2"
                >
                  Load More Streams
                </ButtonCommon>
              ) : (
                null
              )}
            </div>
          </>
        )}

        {/* Stream Keys Modal */}
        <StreamKeysModal
          isOpen={isKeysModalOpen}
          onClose={() => setIsKeysModalOpen(false)}
        />

        {/* Chat Settings Modal */}
        <ChatSettingsModal
          enabled={enabled}
          setEnabled={setEnabled}
          delayed={delayed}
          setDelayed={setDelayed}
          followersOnly={followersOnly}
          setFollowersOnly={setFollowersOnly}
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          isLoading={isLoadingChatSettings}
        />

        {/* Floating Scroll to Top Button */}
        {allStreams.length > pageSize && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110"
            title="Scroll to top"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </main>
    </div>
  );
}
