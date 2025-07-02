'use client';
import Image from 'next/image';
import { groupsQueryApi } from '@/src/apis/groups/query/groups.query.api';
import { useQuery } from '@tanstack/react-query';

const groups = [
  {
    id: 1,
    name: 'Tech Enthusiasts',
    cover: '/images/tech_network.png',
  },
  {
    id: 2,
    name: 'Study Group',
    cover: '/images/hoctap.jpg',
  },
  {
    id: 3,
    name: 'Community Helpers',
    cover: '/images/community.png',
  },
  {
    id: 4,
    name: 'Data Security',
    cover: '/images/data_security.png',
  },
  {
    id: 5,
    name: 'Developers',
    cover: '/images/code.jpg',
  },
  {
    id: 6,
    name: 'Job Seekers',
    cover: '/images/hoi_tim_kiem_viec.jpg',
  },
];

export default function GroupsDiscover() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsQueryApi.getGroups(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Discover Groups</h2>
        <div className="text-center text-gray-500">Loading groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Discover Groups</h2>
        <div className="text-center text-red-500">
          Error loading groups: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Discover Groups</h2>
      {!data || data.length === 0 ? (
        <div className="text-center text-gray-500">No groups found</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((group) => (
          <div
            key={group.id}
            className="flex flex-col gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className="relative h-32 w-full cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}?from=discover`)}
            >
              <Image
                src={group.coverImageUrl || '/images/unify_icon_lightmode.svg'}
                alt={group.name}
                fill
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={false}
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div
                className="mb-1 cursor-pointer truncate text-lg font-semibold text-zinc-800 dark:text-zinc-100"
                onClick={() => router.push(`/groups/${group.id}?from=discover`)}
              >
                {group.name}
              </div>
              {group.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {group.description.length > 100 
                    ? `${group.description.substring(0, 50)}...` 
                    : group.description
                  }
                </p>
              )}
              <button className="mt-auto w-full rounded-lg bg-zinc-800 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:focus:ring-zinc-600">
                Join
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
