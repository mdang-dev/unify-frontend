'use client';

import React from 'react';

import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';
import { Skeleton } from '@/src/components/base';
import { ButtonCommon } from '@/src/components/button';
import { useState } from 'react';
import { set } from 'lodash';
import ChatInfo from './chat-info';

export default function ChatForm({
  onSubmit,
  onChange,
  value,
  isHidden,
  isFollowersOnly,
  isDelayed,
  isFollowing,
}) {
  const [isDelayedBlocked, setIsDelayedBlocked] = useState(false);
  const isFollowersOnlyAndNotFollowing = isFollowersOnly && !isFollowing;
  const isDisabled = isHidden || isDelayedBlocked || isFollowersOnlyAndNotFollowing;
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!value || isDisabled) return;

    if (isDelayed && !isDelayedBlocked) {
      setIsDelayedBlocked(true);
      setTimeout(() => {
        setIsDelayedBlocked(false);
      }, 3000);
    } else {
      onSubmit(value);
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <form className="flex flex-col items-center gap-y-4 p-3" onSubmit={handleSubmit}>
      <div className="w-full">
        <ChatInfo isDelayed={isDelayed} isFollowersOnly={isFollowersOnly} />
        <div className="flex h-auto flex-row items-center justify-between gap-2">
          <Input
            onChange={(e) => onChange(e.target.value)}
            value={value}
            disabled={isDisabled}
            placeholder="Send a message"
            className={cn('border-white/10 ring-0', isFollowersOnly && 'rounded-t-none border-t-0')}
          />
          <ButtonCommon type="submit" className="p-4" disabled={isDisabled}>
            Chat
          </ButtonCommon>
        </div>
      </div>
    </form>
  );
}

export const ChatFormSkeleton = () => {
  return (
    <div className="flex flex-row items-center gap-x-1 p-3">
      <Skeleton className="h-7 w-[80%]" />
      <Skeleton className="h-7 w-[20%]" />
    </div>
  );
};
