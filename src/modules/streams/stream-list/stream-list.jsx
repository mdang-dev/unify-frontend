'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { streamsQueryApi } from '@/src/apis/streams/query/streams.query.api';
import StreamCard from './_components/stream-card';
import StreamKeysModal from './_components/stream-keys-modal';
import StreamCardSkeleton from './_components/stream-card-skeleton';
import { ButtonCommon } from '@/src/components/button';
import FollowingLiveList from './_components/following-live-list';
import { useAuthStore } from '@/src/stores/auth.store';
import { userSuggestionQueryApi } from '@/src/apis/suggested-users/query/suggested-users.query.api';
import ChatSettingsModal from './_components/chat-settings-modal';
import { Settings, Eye, Radio } from 'lucide-react';
import SearchBar from './_components/search-bar';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/src/hooks/use-socket';
import { Skeleton } from '@/src/components/base';

export const mockStreams = [
  {
    id: '1',
    roomId: 'room-1',
    title: 'Chill Coding with JavaScript',
    description: 'Relax and build a project live with chill music 🎵',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    viewerCount: 387,
    streamerName: 'Luna',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna',
    thumbnailUrl:
      'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '2',
    roomId: 'room-2',
    title: 'Valorant Ranked Grind',
    description: 'Road to Immortal - Join my ranked journey 🎮',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    viewerCount: 1052,
    streamerName: 'AceShooter',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=AceShooter',
    thumbnailUrl:
      'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '3',
    roomId: 'room-3',
    title: 'Morning Yoga Flow 🌿',
    description: 'Breathe, stretch, and center yourself for the day.',
    status: 'LIVE',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    viewerCount: 0,
    streamerName: 'Zenita',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Zenita',
    thumbnailUrl:
      'https://images.pexels.com/photos/317155/pexels-photo-317155.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '4',
    roomId: 'room-4',
    title: 'DJ Set - Night Vibes',
    description: 'Live DJ session with lo-fi and chill beats 🎧',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    viewerCount: 921,
    streamerName: 'DJNova',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=DJNova',
    thumbnailUrl:
      'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '5',
    roomId: 'room-5',
    title: 'Drawing Commissions Live',
    description: 'Watch me sketch and paint your favorite characters ✍️',
    status: 'LIVE',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    viewerCount: 0,
    streamerName: 'ArtByMina',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ArtByMina',
    thumbnailUrl:
      'https://images.pexels.com/photos/2179483/pexels-photo-2179483.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '6',
    roomId: 'room-6',
    title: 'Speedrun Sunday - Mario Edition',
    description: 'Trying to beat the world record! 🍄',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    viewerCount: 712,
    streamerName: 'SpeedySam',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SpeedySam',
    thumbnailUrl:
      'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '7',
    roomId: 'room-7',
    title: 'Language Exchange: EN 🇺🇸 + JP 🇯🇵',
    description: 'Let’s practice English and Japanese together! 🌏',
    status: 'LIVE',
    startTime: new Date(Date.now() + 7200000).toISOString(),
    viewerCount: 0,
    streamerName: 'SenseiLeo',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SenseiLeo',
    thumbnailUrl:
      'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '8',
    roomId: 'room-8',
    title: 'Crypto & Tech News',
    description: 'What’s happening this week in crypto 🚀',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    viewerCount: 443,
    streamerName: 'CryptoChris',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=CryptoChris',
    thumbnailUrl:
      'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '9',
    roomId: 'room-9',
    title: 'Cooking Korean Bibimbap 🥘',
    description: 'Watch and learn how to make Bibimbap live!',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    viewerCount: 834,
    streamerName: 'ChefJin',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ChefJin',
    thumbnailUrl:
      'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '10',
    roomId: 'room-10',
    title: 'React Native vs Flutter',
    description: 'Live tech debate & Q&A with mobile devs 📱',
    status: 'LIVE',
    startTime: new Date(Date.now() - 7200000).toISOString(),
    viewerCount: 0,
    streamerName: 'DevsUnited',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=DevsUnited',
    thumbnailUrl:
      'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

const streamers = [
  {
    id: '1',
    name: 'Minh Dev',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    id: '2',
    name: 'Alice Le',
    avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
  {
    id: '3',
    name: 'John Pham',
    avatarUrl: 'https://randomuser.me/api/portraits/men/85.jpg',
  },
  {
    id: '4',
    name: 'Linh Bui',
    avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
  {
    id: '5',
    name: 'Huy Tran',
    avatarUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
  },
  {
    id: '1',
    name: 'Minh Dev',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    id: '2',
    name: 'Alice Le',
    avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
  {
    id: '3',
    name: 'John Pham',
    avatarUrl: 'https://randomuser.me/api/portraits/men/85.jpg',
  },
  {
    id: '4',
    name: 'Linh Bui',
    avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
  {
    id: '5',
    name: 'Huy Tran',
    avatarUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
  },
  {
    id: '1',
    name: 'Minh Dev',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    id: '2',
    name: 'Alice Le',
    avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
  {
    id: '3',
    name: 'John Pham',
    avatarUrl: 'https://randomuser.me/api/portraits/men/85.jpg',
  },
  {
    id: '4',
    name: 'Linh Bui',
    avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
];

export default function StreamList() {
  const t = useTranslations('Streams');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streams, setStreams] = useState([]);
  const isError = undefined;
  const user = useAuthStore((s) => s.user);
  const [client, setClient] = useState(false);

  // Socket connection for real-time live status updates
  const { connected: isSocketConnected, client: socketClient } = useSocket();

  // Local state for user live status (updated via WebSocket)
  const [isUserLive, setIsUserLive] = useState(false);
  const [isLiveStatusLoading, setIsLiveStatusLoading] = useState(true);

  // Fetch chat settings
  const { data: chatSettings, isLoading: isLoadingChatSettings } = useQuery({
    queryKey: [QUERY_KEYS.STREAM_CHAT_SETTINGS, user?.id],
    queryFn: () => streamsQueryApi.getChatSettings(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    router.push(`/streams/${user?.username}`);
  };

  // WebSocket subscription for real-time live status updates
  useEffect(() => {
    if (!isSocketConnected || !socketClient || !user?.id) return;

    // Subscribe to user's stream events
    const streamSubscription = socketClient.subscribe(`/topic/${user?.id}/streams`, (message) => {
      try {
        const streamEvent = JSON.parse(message.body);
        console.log('Stream event received:', streamEvent);
        
        // Update local live status based on server event
        setIsUserLive(streamEvent.isLive || false);
        setIsLiveStatusLoading(false);
        
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIVE_STREAMS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FOLLOWING, user.id] });
        
      } catch (error) {
        console.error('Error parsing stream event:', error);
        setIsLiveStatusLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (streamSubscription) {
        streamSubscription.unsubscribe();
      }
    };
  }, [isSocketConnected, socketClient, user?.id, queryClient]);

  // Initial live status check (fallback)
  useEffect(() => {
    if (!user?.id) return;

    // Check initial live status from API as fallback
    const checkInitialLiveStatus = async () => {
      try {
        setIsLiveStatusLoading(true);
        const response = await streamsQueryApi.getUserLiveStatus(user.id);
        setIsUserLive(response?.isLive || false);
        setIsLiveStatusLoading(false);
      } catch (error) {
        console.error('Error checking initial live status:', error);
        setIsUserLive(false);
        setIsLiveStatusLoading(false);
      }
    };

    checkInitialLiveStatus();
  }, [user?.id]);

  useEffect(() => {
    setTimeout(() => {
      setStreams(mockStreams);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    setClient(true);
  }, []);

  const { data: following, isLoading: isLoadingStreamer } = useQuery({
    queryKey: [QUERY_KEYS.FOLLOWING, user?.id],
    queryFn: () => streamsQueryApi.getFollowedStreamsByUserId(user?.id),
    enabled: !!user?.id,
  
  });

  // const {
  //   data: streams = [],
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: [QUERY_KEYS.LIVE_STREAMS],
  //   queryFn: () => streamsQueryApi.getLiveStreams(),
  //   refetchInterval: 30000,
  // });

  const handleStreamCreated = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIVE_STREAMS] });
  };
if(!client) return null;
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <main className="container mx-auto px-10 py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-bold">{t('Title')}</h1>

          <SearchBar />
          <div className="flex gap-2">
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

            {/* Live Stream View Button - Show when user is live, positioned to the right */}
            {isUserLive && !isLiveStatusLoading && (
              <ButtonCommon
                size="lg"
                onClick={handleLiveStreamClick}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
              >
                {/* Animated stream effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 animate-pulse"></div>
                
                {/* Live indicator dot */}
                <div className="relative z-10 flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{t('ViewStream')}</span>
                </div>
              </ButtonCommon>
            )}

            {/* Live Status Loading State */}
            {isLiveStatusLoading && (
              <Skeleton className="h-10 w-32 rounded-lg" />
            )}

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
          </div>
          <FollowingLiveList streamers={following} isLoading={isLoadingStreamer} />
        </div>

        {/* Stream list or state */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <StreamCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center text-destructive">Failed to load streams.</div>
        ) : streams.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-muted-foreground">No live streams available</p>
            <ButtonCommon onClick={() => setIsCreateModalOpen(true)}>
              Create the first stream
            </ButtonCommon>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
