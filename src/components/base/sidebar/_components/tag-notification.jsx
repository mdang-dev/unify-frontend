'use client';

import React from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/avt.jpg';
import TagName from '@/public/images/tag.png';

// eslint-disable-next-line react/display-name
export const TagNotification = React.memo(({ isSeen = false }) => (
  <div
    className={`max-h-[88px] rounded-lg p-2 px-4 ${
      isSeen ? '' : 'bg-gray-200 dark:bg-neutral-700'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className="relative h-12 w-12">
        <Image src={Avatar} alt="User Avatar" className="rounded-full" />
        <Image
          src={TagName}
          alt="Tag Icon"
          className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
        />
      </div>
      <div className="flex flex-col">
        <p className="line-clamp-2">
          <strong className="text-lg font-extrabold">Username</strong> has tagged you in a post.
        </p>
        <small className="text-sm text-gray-400">30 seconds ago</small>
      </div>
    </div>
  </div>
));
