import React from 'react';
import { VideoOff } from 'lucide-react';

export default function OfflineVideo({ username }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
      <VideoOff className="mb-2 h-10 w-10" />
      <span className="text-sm font-medium">{username} is offline</span>
    </div>
  );
}
