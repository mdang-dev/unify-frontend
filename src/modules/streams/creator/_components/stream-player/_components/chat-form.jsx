'use client';

import React from 'react';

import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';
import { Skeleton } from '@/src/components/base';
import { ButtonCommon } from '@/src/components/button';
import { useState, useEffect, useRef } from 'react';
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
  const [delayedMessage, setDelayedMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const countdownRef = useRef(null);
  const isFollowersOnlyAndNotFollowing = isFollowersOnly && !isFollowing;
  // Only disable if hidden or followers-only restriction, not during delay
  const isDisabled = isHidden || isFollowersOnlyAndNotFollowing;
  
  // Handle delayed message sending
  useEffect(() => {
    if (isDelayedBlocked && countdown === 0 && delayedMessage && !isSending) {
      // Send the delayed message
      setIsSending(true);
      onSubmit(delayedMessage);
      setDelayedMessage('');
      setIsDelayedBlocked(false);
      setIsSending(false);
    }
  }, [isDelayedBlocked, countdown, delayedMessage, isSending, onSubmit]);
  
  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!value || isDisabled) return;

    if (isDelayed && !isDelayedBlocked) {
      // Store the message and block for 3 seconds
      setDelayedMessage(value);
      setIsDelayedBlocked(true);
      setCountdown(3);
      
      // Clear the input immediately to prevent duplicate
      onChange('');
      
      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            return 0; // useEffect will handle sending when countdown reaches 0
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Send immediately if not delayed
      onSubmit(value);
      onChange(''); // Clear input after sending
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <form className="flex flex-col items-center gap-y-4 p-3" onSubmit={handleSubmit}>
      <div className="w-full">
        <ChatInfo isDelayed={isDelayed} isFollowersOnly={isFollowersOnly} />
        
        {/* Show delay status when message is being delayed */}
        {isDelayedBlocked && (
          <div className="mb-3 text-center text-sm bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="font-semibold text-primary mb-2">
              Message queued for {countdown} second{countdown !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              You can type another message while waiting
            </div>
            <div className="text-xs bg-primary/5 border border-primary/15 rounded-md p-2.5 text-primary/90">
              <span className="font-medium">Queued message:</span> "{delayedMessage}"
            </div>
          </div>
        )}
        
        <div className="flex h-auto flex-row items-center justify-between gap-2">
          <Input
            onChange={(e) => onChange(e.target.value)}
            value={value}
            disabled={isDisabled}
            placeholder={isDelayedBlocked ? "Type another message..." : "Send a message"}
            className={cn('dark:border-white/10 ring-0 border-black/10', isFollowersOnly && 'rounded-t-none border-t-0')}
          />
          <ButtonCommon 
            type="submit" 
            className="p-4" 
            disabled={isDisabled || isDelayedBlocked}
          >
            {isDelayedBlocked ? "Queued" : "Chat"}
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
