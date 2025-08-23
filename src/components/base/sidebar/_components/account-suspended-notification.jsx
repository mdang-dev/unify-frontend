'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/avt-exp.jpg';
import { formatDistanceToNow } from 'date-fns';

const AccountSuspendedNotification = React.memo(function AccountSuspendedNotification({
  isSeen,
  sender,
  timestamp,
  onClick,
}) {
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
      className={`max-h-[88px] cursor-pointer items-center rounded-xl p-2 px-4 transition-colors duration-200 ${
        isSeen
          ? 'hover:bg-gray-100 dark:hover:bg-neutral-800'
          : 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Image
            src={sender?.avatar || Avatar}
            alt="User"
            width={50}
            height={50}
            className="aspect-square rounded-full border border-gray-300 object-cover dark:border-neutral-700"
          />
          {/* Warning icon overlay */}
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
            <i className="fa-solid fa-clock text-xs"></i>
          </div>
        </div>

        <div className="flex flex-grow flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <p className="text-md dark:text-zinc-300">
                <strong className="text-sm font-extrabold dark:text-zinc-200">
                  {sender.fullName}
                </strong>{' '}
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  temporarily suspended your account.
                </span>{' '}
              </p>
              <small className="text-zinc-500 dark:text-neutral-500">{timeAgo}</small>
            </div>
          </div>

          {/* Additional warning message */}
          <div className="mt-1">
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
              ⏰ Your account is temporarily suspended due to multiple violations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AccountSuspendedNotification;
