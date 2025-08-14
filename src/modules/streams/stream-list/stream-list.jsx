'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import CreateStreamModal from './_components/create-stream-modal';
import StreamCardSkeleton from './_components/stream-card-skeleton';
import { ButtonCommon } from '@/src/components/button';
import { useEffect } from 'react';
import FollowingLiveList from './_components/following-live-list';
import { useAuthStore } from '@/src/stores/auth.store';
import { userSuggestionQueryApi } from '@/src/apis/suggested-users/query/suggested-users.query.api';
import ChatSettingsModal from './_components/chat-settings-modal';
import { Settings } from 'lucide-react';
import SearchBar from './_components/search-bar';
import { useTranslations } from 'next-intl';

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
  const queryClient = useQueryClient();
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streams, setStreams] = useState([]);
  const isError = undefined;
  const [enabled, setEnabled] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [followersOnly, setFollowersOnly] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setTimeout(() => {
      setStreams(mockStreams);
      setIsLoading(false);
    }, 5000);
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
                  Stream Keys
                </ButtonCommon>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Stream Keys</DialogTitle>
                </DialogHeader>
                <StreamKeysModal
                  isOpen={isKeysModalOpen}
                  onClose={() => setIsKeysModalOpen(false)}
                />
              </DialogContent>
            </Dialog>

            {/* Stream Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <ButtonCommon size="lg" variant="secondary">
                  + Create Stream
                </ButtonCommon>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create a Stream</DialogTitle>
                </DialogHeader>
                <CreateStreamModal
                  isOpen={isCreateModalOpen}
                  onClose={() => setIsCreateModalOpen(false)}
                  onStreamCreated={handleStreamCreated}
                />
              </DialogContent>
            </Dialog>

            {/* Settings Modal */}
            <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
              <DialogTrigger asChild>
                <ButtonCommon size="lg" className>
                  <Settings className="h-4 w-4" />
                </ButtonCommon>
              </DialogTrigger>
              <DialogContent className="bg-[#1e1e1e] text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Chat Settings</DialogTitle>
                </DialogHeader>

                <ChatSettingsModal
                  enabled={enabled}
                  setEnabled={setEnabled}
                  delayed={delayed}
                  setDelayed={setDelayed}
                  followersOnly={followersOnly}
                  setFollowersOnly={setFollowersOnly}
                />
              </DialogContent>
            </Dialog>
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
