import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Hint } from '@/src/components/base';

export default function ChatInfo({ isDelayed, isFollowersOnly }) {
  const hint = useMemo(() => {
    if (isFollowersOnly && !isDelayed) {
      return 'Only followers can chat';
    }

    if (isDelayed && !isFollowersOnly) {
      return 'Messages are delayed for 3 seconds';
    }

    if (isDelayed && isFollowersOnly) {
      return 'Only followers can chat. Messages are delayed for 3 seconds';
    }

    return '';
  }, [isDelayed, isFollowersOnly]);

  if (!isDelayed && !isFollowersOnly) return null;

  return (
    <div className="flex w-full items-center gap-x-2 rounded-t-md border border-white/10 bg-white/5 p-2 text-muted-foreground">
      <Hint label={hint}>
        <Info className="h-4 w-4" />
      </Hint>
      <p>{hint}</p>
    </div>
  );
}
