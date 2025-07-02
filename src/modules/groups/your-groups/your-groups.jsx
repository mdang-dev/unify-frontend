'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/src/components/ui/popover';

const yourGroups = [
  {
    id: 1,
    name: 'Tech Enthusiasts',
    cover: '/images/tech_network.png',
    members: 1240,
  },
  {
    id: 2,
    name: 'Study Group',
    cover: '/images/hoctap.jpg',
    members: 320,
  },
  {
    id: 3,
    name: 'Community Helpers',
    cover: '/images/community.png',
    members: 980,
  },
  {
    id: 4,
    name: 'Data Security',
    cover: '/images/data_security.png',
    members: 410,
  },
  {
    id: 5,
    name: 'Developers',
    cover: '/images/code.jpg',
    members: 2100,
  },
  {
    id: 6,
    name: 'Job Seekers',
    cover: '/images/hoi_tim_kiem_viec.jpg',
    members: 150,
  },
];

export default function YourGroups() {
  const [openPopover, setOpenPopover] = useState(null);
  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Your Groups</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {yourGroups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="relative h-32 w-full">
              <Image
                src={group.cover}
                alt={group.name}
                fill
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
                priority={false}
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="mb-1 truncate text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {group.name}
              </div>
              <div className="mb-2 text-sm text-neutral-400 dark:text-zinc-400">
                {group.members.toLocaleString()} members
              </div>
              <div className="mt-auto flex gap-2">
                <button className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:focus:ring-zinc-600">
                  View Group
                </button>
                <Popover
                  open={openPopover === group.id}
                  onOpenChange={(open) => setOpenPopover(open ? group.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      aria-label="More options"
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-40 border border-zinc-200 bg-white p-0 text-zinc-800 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <button className="w-full rounded-b-lg px-4 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      Leave Group
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
