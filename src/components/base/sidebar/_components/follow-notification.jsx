/* eslint-disable react/display-name */
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import FollowButton from '../../../button/follow-button';
import Avatar from '@/public/images/avt-exp.jpg';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/src/stores/auth.store';

const FollowNotification = React.memo(({ isSeen, sender, timestamp, onClick }) => {
  const { user } = useAuthStore();

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('FollowNotification render:', { 
      user: user?.id, 
      sender: sender?.id, 
      senderName: sender?.fullName,
      isSeen 
    });
  }

  if (!sender || !sender.fullName) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const timeAgo = useMemo(() => {
    const time = formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      includeSeconds: true,
    });
    return time.replace('about ', '');
  }, [timestamp]);

  return (
    <div
      className={`max-h-[88px] cursor-pointer items-center rounded-xl p-2 px-4 ${
        isSeen ? '' : 'bg-gray-200 dark:bg-neutral-800'
      }`}
    >
      <div className="flex items-center gap-4"
            onClick={onClick}>
        <Image
          src={sender?.avatar || Avatar}
          alt="User"
          width={50}
          height={50}
          className="aspect-square rounded-full border border-gray-300 object-cover dark:border-neutral-700"
        />
        <div className="flex flex-grow flex-col">
          <div className="flex items-center justify-between gap-2">
            <p className="text-md dark:text-zinc-300">
              <strong className="text-sm font-extrabold dark:text-zinc-200">
                {sender.fullName}
              </strong>{' '}
              has started following you.{' '}
              <small className="text-zinc-500 dark:text-neutral-500">{timeAgo}</small>
            </p>
            <div onClick={(e) => e.stopPropagation()}>
              {user?.id && sender?.id ? (
            <FollowButton
                  userId={user.id}
                  followingId={sender.id}
                  classFollow="bg-red-500 text-white rounded-md px-2 py-1 text-sm w-full h-full self-center"
                  classFollowing="bg-transparent text-black dark:text-zinc-200 border border-gray-400 dark:border-neutral-600 rounded-md px-2 py-1 text-sm bg-transparent w-full h-full self-center"
              contentFollow="Follow"
              contentFollowing="Following"
            />
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  {!user?.id ? 'No user' : 'No sender'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FollowNotification;
