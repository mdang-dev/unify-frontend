'use client';

import { Card } from '@/src/components/ui/card';
import { Skeleton } from '@/src/components/ui/skeleton';

export default function StreamCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-lg border bg-background shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-muted">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        <Skeleton className="absolute left-2 top-2 h-5 w-12 rounded-md" /> {/* status badge */}
        <Skeleton className="absolute right-2 top-2 h-5 w-14 rounded-md" /> {/* viewer count */}
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

        {/* Text content */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      </div>
    </Card>
  );
}
