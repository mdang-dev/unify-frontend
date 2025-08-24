'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Radio, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FollowingLiveList({ 
  followingUsers = [], 
  isLoading = false, 
  error = null 
}) {
  const router = useRouter();
  const handleWatchStream = (follower) => {
    if (follower?.username) {
      router.push(`/streams/${follower.username}`);
    }
  };

  // Separate live and offline followers
  const liveFollowers = followingUsers.filter(f => f.isLive);
  const offlineFollowers = followingUsers.filter(f => !f.isLive);

  // Show skeletons while loading
  if (isLoading) {
    return (
      <section className="w-full">
        <div className="mb-2 flex items-center gap-2 px-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Following</h2>
         
        </div>
        <div className="no-scrollbar w-full overflow-x-auto whitespace-nowrap">
          <div className="mb-1 flex gap-4 px-3 pt-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex w-[60px] animate-pulse flex-col items-center text-center"
              >
                <div className="relative rounded-full p-[2px]">
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-3 w-10 rounded" />
                <Skeleton className="mt-1 h-2 w-6 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show empty state if no followers
  if (followingUsers.length === 0) {
    return (
      <section className="w-full">
        <div className="mb-2 flex items-center gap-2 px-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Following</h2>
        </div>
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No followers yet
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="mb-2 flex items-center gap-2 px-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Following</h2>
        <div className="ml-auto flex items-center gap-1">
          
        </div>
      </div>
      
      <div className="no-scrollbar w-full overflow-x-auto whitespace-nowrap">
        <div className="mb-1 flex gap-4 px-3 pt-1">
          {/* Live Followers First */}
          {liveFollowers.map((follower, index) => (
            <div
              key={`live-${follower.id}`}
              className="group flex w-[60px] flex-col items-center text-center transition-all duration-200 hover:scale-105"
              onClick={() => handleWatchStream(follower)}
            >
              {/* Avatar with live indicator */}
              <div className="relative cursor-pointer rounded-full p-[2px] shadow-lg shadow-red-400/40 ring-2 ring-red-500">
                <Avatar className="h-12 w-12">
                  {follower?.avtUrl ? (
                    <AvatarImage 
                      src={follower.avtUrl} 
                      alt={follower.username}
                      className="object-cover object-center w-full h-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                      {follower?.firstName?.charAt(0)?.toUpperCase() || follower?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              {/* Username */}
              <p className="mt-2 truncate text-[11px] font-medium leading-none text-foreground">
                {follower?.username}
              </p>
              
              {/* Live status */}
              <div className="mt-1 flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-red-500" />
                <span className="text-[10px] font-semibold text-red-500">LIVE</span>
              </div>
            </div>
          ))}

          {/* Offline Followers */}
          {offlineFollowers.map((follower, index) => (
            <div
              key={`offline-${follower.id}`}
              className="group flex w-[60px] flex-col items-center text-center transition-all duration-200 hover:scale-105"
             
            >
              {/* Avatar without live indicator */}
              <div className="relative rounded-full p-[2px] shadow-md shadow-gray-400/20 ring-1 ring-gray-300/30"  onClick={() => handleWatchStream(follower)}>
                <Avatar className="h-12 w-12">
                  {follower?.avtUrl ? (
                    <AvatarImage 
                      src={follower.avtUrl} 
                      alt={follower.username}
                      className="object-cover object-center w-full h-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                      {follower?.firstName?.charAt(0)?.toUpperCase() || follower?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              {/* Username */}
              <p className="mt-2 truncate text-[11px] font-medium leading-none text-muted-foreground">
                {follower?.username}
              </p>
              
              {/* Offline status */}
              <span className="mt-1 text-[10px] font-medium text-muted-foreground">OFFLINE</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Live count indicator */}
      {liveFollowers.length > 0 && (
        <div className="px-3 py-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <span>{liveFollowers.length} live now</span>
          </div>
        </div>
      )}
    </section>
  );
}
