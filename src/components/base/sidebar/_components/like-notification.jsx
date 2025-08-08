'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/avt-exp.jpg';
import { formatDistanceToNow } from 'date-fns';

const LikeNotification = React.memo(function LikeNotification({ isSeen, sender, timestamp, onClick }) {
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
      onClick={onClick}
      className={`max-h-[88px] cursor-pointer items-center rounded-xl p-2 px-4 ${
        isSeen ? '' : 'bg-gray-200 dark:bg-neutral-800'
      }`}
    >
      <div className="flex items-center gap-4">
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
              liked your post.{' '}
              <small className="text-zinc-500 dark:text-neutral-500">{timeAgo}</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LikeNotification; 