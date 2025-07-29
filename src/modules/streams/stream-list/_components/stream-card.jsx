'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Video, Eye } from 'lucide-react';

export default function StreamCard({ stream }) {
  const router = useRouter();

  const handleJoinStream = () => {};

  return (
    <Card
      onClick={handleJoinStream}
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-transform hover:scale-[1.015] hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt="Stream thumbnail"
            className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Video className="h-8 w-8" />
            <span className="text-sm font-medium">No Thumbnail</span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute bottom-0 left-0 flex w-full items-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <Avatar className="h-8 w-8 ring-2 ring-white">
            <AvatarImage src={stream.avatarUrl || ''} />
            <AvatarFallback>{stream.streamerName[0]}</AvatarFallback>
          </Avatar>
          <p className="truncate text-sm font-medium text-white">{stream.streamerName}</p>
        </div>

        {/* LIVE Badge */}
        {stream.status === 'LIVE' && (
          <Badge className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-[2px] text-xs font-bold text-white">
            LIVE
          </Badge>
        )}

        {/* Viewer Count */}
        {stream.status === 'LIVE' && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-[2px] text-xs text-white">
            <Eye className="h-4 w-4" />
            {stream.viewerCount ?? 0}
          </div>
        )}
      </div>

      {/* Stream Info */}
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-1 text-base font-semibold">{stream.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{stream.description}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(stream.startTime).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
