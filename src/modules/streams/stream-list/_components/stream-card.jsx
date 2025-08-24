'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Video, User } from 'lucide-react';

export default function StreamCard({ stream }) {
  const router = useRouter();

  const handleJoinStream = () => {
    if (stream?.user?.username) {
      router.push(`/streams/${stream.user.username}`);
    }
  };

  // Generate fallback thumbnail with user initials
  const getFallbackThumbnail = () => {
    const username = stream.user?.username || 'user';
    const charCode = username.charCodeAt(0);
    
    // Generate black and white gradients based on username character code for consistency
    const colors = [
      'from-black to-gray-800',
      'from-gray-900 to-black',
      'from-black to-gray-700',
      'from-gray-800 to-black',
      'from-gray-700 to-gray-900',
      'from-black to-gray-600',
      'from-gray-800 to-gray-700',
      'from-gray-600 to-black',
      'from-black to-gray-500',
      'from-gray-900 to-gray-700',
    ];
    
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  };

  const isFallbackThumbnail = !stream.thumbnailUrl;

  return (
    <Card
      onClick={handleJoinStream}
      className="group cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent shadow-none transition-all duration-200 hover:scale-[1.02]"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        {!isFallbackThumbnail ? (
          // Real thumbnail
          <img
            src={stream.thumbnailUrl}
            alt={`${stream.user?.username}'s stream`}
            className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        ) : (
          // Fallback thumbnail with gradient and user initial
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getFallbackThumbnail()} transition-all duration-300 group-hover:scale-105 relative overflow-hidden`}>
            {/* Blurred background using user's avatar */}
            {stream.user?.avatar?.url && (
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={stream.user?.avatar?.url} 
                  alt=""
                  className="w-full h-full object-cover blur-md scale-110 opacity-30"
                />
              </div>
            )}
            
            {/* Avatar in the middle */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-lg z-10">
              {stream.user?.avatar?.url ? (
                <img 
                  src={stream.user?.avatar?.url} 
                  alt={stream.user?.username}
                  className="object-cover object-center w-full h-full rounded-full"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {stream.user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* LIVE Badge - Top Left */}
        {stream.isLive && (
          <Badge className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
            LIVE
          </Badge>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent h-16" />
      </div>

      {/* Stream Info - Below Thumbnail */}
      <div className="mt-3 flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-background overflow-hidden">
            {stream.user?.avatar?.url ? (
              <AvatarImage 
                src={stream.user?.avatar?.url} 
                alt={stream.user?.username}
                className="object-cover object-center w-full h-full"
              />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-black to-gray-800 text-white border border-gray-600">
                {stream.user?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Stream Details */}
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
            {stream.title || 'Untitled Stream'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            {stream.user?.username || 'Unknown User'}
          </p>
          {stream.description && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {stream.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
