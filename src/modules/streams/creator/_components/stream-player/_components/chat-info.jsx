import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Hint } from '@/src/components/base';

export default function ChatInfo({isHost, isDelayed, isFollowersOnly }) {
  const hint = useMemo(() => {
    // --- Host messages ---
    if (isHost) {
      if (isFollowersOnly && isDelayed) {
        return "You’re the host — but viewers must be followers, and their messages are delayed 3s.";
      }
      if (isFollowersOnly) {
        return "You’re the host — but only followers can chat.";
      }
      if (isDelayed) {
        return "You’re the host — but viewers’ messages are delayed 3s.";
      }
    }

    // --- Viewer messages ---
    if (isFollowersOnly && isDelayed) {
      return "Only followers can chat. Messages are delayed for 3 seconds.";
    }
    if (isFollowersOnly) {
      return "Only followers can chat.";
    }
    if (isDelayed) {
      return "Messages are delayed for 3 seconds.";
    }

    return null;
  }, [isHost, isDelayed, isFollowersOnly]);

  if (!hint) return null;

  return (
    <div className="flex w-full text-xs items-center gap-x-2 rounded-t-md border border-white/10 bg-white/5 p-2 text-muted-foreground">
      <Hint label={hint}>
        <Info className="h-4 w-4" />
      </Hint>
      <p>{hint}</p>
    </div>
  );
}
