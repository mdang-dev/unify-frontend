'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Discover Groups</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className="relative h-32 w-full cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}?from=discover`)}
            >
              <Image
                src={group.cover}
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
              <button className="mt-auto w-full rounded-lg bg-zinc-800 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-zinc-600">
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
