'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSuggestedUsers } from '@/src/hooks/use-suggested';

const People = () => {
  const scrollRef = useRef(null);
  const router = useRouter();
  const [showArrows, setShowArrows] = useState(false);

  const { suggestedUsers = [], loading: isLoading } = useSuggestedUsers();

  useEffect(() => {
    setShowArrows(suggestedUsers.length > 5);
  }, [suggestedUsers]);

  const handleClick = (username) => {
    if (!username) {
      console.error('Lỗi: Username bị null hoặc undefined!');
      return;
    }
    router.push(`/others-profile/${username}`);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative mx-2 mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-black">
      {showArrows && (
        <button
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-100 p-1.5 opacity-90 shadow-sm transition-opacity hover:opacity-100 dark:bg-neutral-700"
          onClick={() => scroll('left')}
        >
          <ChevronLeft size={16} className="text-zinc-700 dark:text-gray-300" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex max-w-[calc(100vw-16px)] gap-4 overflow-x-auto scroll-smooth px-4 py-2 scrollbar-hide"
      >
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : suggestedUsers.length > 0 ? (
          suggestedUsers.slice(0, 10).map((user, index) => (
            <div
              key={user.username}
              onClick={() => handleClick(user.username)}
              className="group flex min-w-[80px] cursor-pointer flex-col items-center"
            >
              <div className="relative h-[70px] w-[70px] overflow-hidden rounded-full border-2 border-gray-200 transition-colors group-hover:border-pink-500 dark:border-gray-700">
                <Image
                  src={user?.avatar?.url || '/images/unify_icon_2.png'}
                  alt="Avatar"
                  width={70}
                  height={70}
                  priority={index < 3}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-1 max-w-[70px] truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                {user.username}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No suggestions available.</p>
        )}
      </div>

      {showArrows && (
        <button
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-100 p-1.5 opacity-90 shadow-sm transition-opacity hover:opacity-100 dark:bg-neutral-800"
          onClick={() => scroll('right')}
        >
          <ChevronRight size={16} className="text-zinc-700 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
};

export default People;
