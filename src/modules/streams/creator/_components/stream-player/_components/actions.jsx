'use client';

import { useState } from 'react';
import { ButtonCommon } from '@/src/components/button';
import { cn } from '@/src/lib/utils';
import { Check, Plus } from 'lucide-react';

export default function Actions({ hostIdentity, isFollowing = false, isHost }) {
  const [following, setFollowing] = useState(isFollowing);

  if (isHost) return null;

  const handleToggle = () => {
    setFollowing((prev) => !prev);
  };

  return (
    <ButtonCommon
      size="sm"
      onClick={handleToggle}
      className={cn(
        'w-full gap-1 rounded-full font-medium lg:w-auto',
        'transition-all duration-300 ease-in-out',
        'hover:scale-105 hover:shadow-lg hover:brightness-110 active:scale-95',
        following
          ? 'bg-neutral-500 text-white hover:bg-neutral-400'
          : 'bg-primary text-black hover:bg-primary/80'
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
