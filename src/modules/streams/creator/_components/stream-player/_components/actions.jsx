'use client';

import { ButtonCommon } from '@/src/components/button';
import { cn } from '@/src/lib/utils';
import { Check, Plus } from 'lucide-react';
import { useFollow } from '@/src/hooks/use-follow';

export default function Actions({ currentUserId, hostIdentity, isHost }) {
  // Early returns for edge cases
  if (isHost || !currentUserId || currentUserId === hostIdentity) return null;
  
  // Use the exact same pattern as the working FollowButton
  const { isFollowing, toggleFollow } = useFollow(currentUserId, hostIdentity);
  const following = isFollowing ?? false;

  return (
    <ButtonCommon
      size="sm"
      onClick={() => toggleFollow(!following)}
      className={cn(
        'w-full gap-1 rounded-full font-medium lg:w-auto',
        'transition-all duration-300 ease-in-out',
        'hover:scale-105 hover:shadow-lg hover:brightness-110 active:scale-95',
        following
          ? 'bg-neutral-500 text-white hover:bg-neutral-400 '
          : 'bg-primary dark:text-black text-white hover:bg-primary/80'
      )}
    >
      {following ? (
        <>
          <Check className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Follow
        </>
      )}
    </ButtonCommon>
  );
}
