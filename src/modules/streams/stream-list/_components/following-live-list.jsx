'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar';
import { Skeleton } from '@/src/components/ui/skeleton';

export default function FollowingLiveList({ streamers = [], isLoading = true }) {
  const handleWatchStream = (streamer) => {
    if (streamer?.username) {
      window.location.href = `/streams/${streamer.username}`;
    }
  };

  // number of skeletons to show
  const skeletonCount = 8;

  if (streamers.length === 0) return <div className="mb-3 w-full"></div>;

  return (
    <section className="w-full">
      <h2 className="mb-2 px-2 text-base font-semibold">Following</h2>
      <div className="no-scrollbar w-full overflow-x-auto whitespace-nowrap">
        <div className="mb-1 flex gap-4 px-3 pt-1">
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, index) => (
                <div
                  key={index}
                  className="flex w-[60px] animate-pulse flex-col items-center text-center"
                >
                  {/* Skeleton Avatar */}
                  <div className="relative rounded-full p-[2px]">
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                  {/* Skeleton Name */}
                  <Skeleton className="mt-2 h-3 w-10 rounded" />
                  {/* Skeleton Live tag */}
                  <Skeleton className="mt-1 h-2 w-6 rounded" />
                </div>
              ))
            : streamers.map((streamer, index) => (
                <div
                  key={index}
                  className="flex w-[60px] flex-col items-center text-center transition-transform hover:scale-105"
                  onClick={() => handleWatchStream(streamer)}
                >
                  {/* Avatar with red pulse ring */}
                  <div className="relative cursor-pointer rounded-full p-[2px] shadow-md shadow-red-400/30 ring-2 ring-red-500">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={streamer?.avatar?.url} alt={streamer.username} />
                      <AvatarFallback>{streamer?.username}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name and LIVE below */}
                  <p className="mt-2 truncate text-[11px] font-medium leading-none">
                    {streamer?.username}
                  </p>
                  <span className="mt-[2px] text-[10px] font-semibold text-red-500">LIVE</span>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
