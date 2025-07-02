'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

const navItems = [
  {
    label: 'Your Feed',
    href: '/groups/feed',
    icon: 'fa-solid fa-blog',
  },
  {
    label: 'Discover',
    href: '/groups/discover',
    icon: 'fa-solid fa-compass-drafting',
  },
  {
    label: 'Your Groups',
    href: '/groups/your-groups',
    icon: 'fa-solid fa-people-group',
  },
];

// Example joined groups (replace with real data)
const joinedGroups = [
  {
    id: 1,
    name: 'Tech Enthusiasts',
    avatar: '/images/tech_network.png',
  },
  {
    id: 2,
    name: 'Study Group',
    avatar: '/images/hoctap.jpg',
  },
  {
    id: 3,
    name: 'Community Helpers',
    avatar: '/images/community.png',
  },
  {
    id: 4,
    name: 'Data Security',
    avatar: '/images/data_security.png',
  },
  {
    id: 5,
    name: 'Developers',
    avatar: '/images/code.jpg',
  },
  {
    id: 6,
    name: 'Job Seekers',
    avatar: '/images/hoi_tim_kiem_viec.jpg',
  },
];

// Example managed groups (replace with real data)
const managedGroups = [
  {
    id: 1,
    name: 'Tech Enthusiasts',
    avatar: '/images/tech_network.png',
  },
  {
    id: 4,
    name: 'Data Security',
    avatar: '/images/data_security.png',
  },
];

export default function Sidebar() {
  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const filteredGroups = joinedGroups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredManagedGroups = managedGroups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex h-full w-80 flex-col border-r bg-neutral-100 shadow-md dark:bg-zinc-900">
      {/* Sticky Title + Create Button */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-zinc-200 bg-neutral-100 px-6 pb-4 pt-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Groups</h2>
        <button
          className="flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-base font-bold text-white shadow transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
          onClick={() => router.push('/groups/create')}
        >
          <i className="fa-solid fa-plus"></i>
          Create Group
        </button>
        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            <i className="fa-solid fa-magnifying-glass"></i>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full rounded-lg border border-zinc-300 bg-neutral-50 py-2 pl-10 pr-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
          />
        </div>
        {/* Sticky Nav */}
        <div className="sticky top-[120px] z-10 mb-2 mt-4 rounded-lg bg-white shadow-sm dark:bg-zinc-900">
          <nav className="flex flex-col gap-2 p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2 text-base font-medium transition-colors ${isActive ? 'bg-zinc-200 text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <i className={`${item.icon} text-lg`}></i>
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {/* Scrollable Content */}
      <div className="scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-500 dark:hover:scrollbar-thumb-zinc-600 flex-1 overflow-y-auto px-6 pb-6 pt-4">
        {/* Your Groups Section */}
        <div className="mb-6">
          <div className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Your Groups
          </div>
          <ul className="space-y-1 pr-1">
            {filteredGroups.length === 0 && (
              <li className="px-2 py-2 text-sm text-zinc-400 dark:text-zinc-600">
                No groups found.
              </li>
            )}
            {filteredGroups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-zinc-800 transition hover:bg-zinc-200 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                    <Image
                      src={group.avatar}
                      alt={group.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="truncate text-left">{group.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Groups You Manage Section */}
        <div>
          <div className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Groups You Manage
          </div>
          <ul className="space-y-1 pr-1">
            {filteredManagedGroups.length === 0 && (
              <li className="px-2 py-2 text-sm text-zinc-400 dark:text-zinc-600">
                No managed groups.
              </li>
            )}
            {filteredManagedGroups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-zinc-800 transition hover:bg-zinc-200 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                    <Image
                      src={group.avatar}
                      alt={group.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="truncate text-left">{group.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
