'use client';

import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useSuggestedUsers } from '@/src/hooks/use-suggested';

const User = ({ href = '', username = '', firstname = '', lastname = '', avatar = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    <Link
      href={href}
      className="block rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
    >
      <div className="flex items-center p-2">
        <div className="relative h-14 w-14">
          <img
                          src={avatar || '/images/unify_icon_2.png'}
            alt={username}
            className="h-full w-full rounded-full border border-gray-300 transition-transform hover:scale-105 dark:border-neutral-700"
          />
        </div>
        <div className="ml-4">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">@{username}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {firstname} {lastname}
          </p>
        </div>
      </div>
    </Link>
  </motion.div>
);

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div className="flex items-center p-2" key={index}>
        <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="ml-4 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    ))}
  </div>
);

const SuggestedUsers = () => {
  const t = useTranslations('Home.SuggestedUsers');
  const { suggestedUsers, loading, error } = useSuggestedUsers();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="py-4 text-center text-gray-500 dark:text-gray-400">
        {t('FailedToLoadSuggestions')}
      </div>
    );
  }

  if (!suggestedUsers?.length) {
    return (
      <div className="py-4 text-center text-gray-500 dark:text-gray-400">
        {t('NoSuggestionsAvailable')}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {suggestedUsers.map((user) => (
        <User
          key={user?.id}
          avatar={user?.avatar?.url}
          href={`/others-profile/${user?.username}`}
          username={user?.username}
          firstname={user?.firstName}
          lastname={user?.lastName}
        />
      ))}
    </div>
  );
};

export default SuggestedUsers;
