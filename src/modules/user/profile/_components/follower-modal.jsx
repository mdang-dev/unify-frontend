import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FollowButton } from '@/src/components/button';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userSuggestionQueryApi } from '@/src/apis/suggested-users/query/suggested-users.query.api';
import UserSkeleton from './user-skeleton';

const FollowerModal = ({ isOpen, onClose, userId, currentUserId }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: followers, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.FOLLOWERS, userId],
    queryFn: () => userSuggestionQueryApi.follower(userId),
    enabled: !!userId && isOpen,
  });

  const filteredFollowers = followers?.filter((follower) =>
    follower.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex max-h-[600px] w-[400px] flex-col rounded-xl bg-white dark:bg-neutral-900">
        <div className="border-b p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Followers</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-2xl font-bold text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="divide-y dark:divide-neutral-800">
              {[...Array(5)].map((_, index) => (
                <UserSkeleton key={index} />
              ))}
            </div>
          ) : filteredFollowers?.length > 0 ? (
            <div className="divide-y dark:divide-neutral-800">
              {filteredFollowers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                >
                  <div
                    className="flex cursor-pointer items-center gap-3"
                    onClick={() => {
                      router.push(`/others-profile/${follower.username}`);
                      onClose();
                    }}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={follower.avatar?.url || '/images/unify_icon_2.svg'}
                        alt={follower.username}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {follower.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{follower.name}</p>
                    </div>
                  </div>
                  {follower.id !== currentUserId && (
                    <FollowButton
                      userId={currentUserId}
                      followingId={follower.id}
                      classFollow="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm font-medium"
                      classFollowing="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm font-medium"
                      contentFollow="Follow"
                      contentFollowing="Following"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <p className="mb-2 text-lg font-medium">No followers found</p>
              <p className="text-sm">
                {searchQuery
                  ? 'Try a different search term'
                  : "When people follow you, they'll appear here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowerModal;
