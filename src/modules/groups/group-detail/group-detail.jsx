'use client';
import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

// Placeholder data for demonstration
const group = {
  id: 1,
  name: 'Tech Enthusiasts',
  cover: '/images/F1.jpg',
  members: 1240,
  privacy: 'Public',
  description: 'A group for people passionate about technology, gadgets, and innovation.',
  avatars: ['/images/avatar.png', '/images/avt-exp.jpg'],
};

const tabs = [
  { key: 'about', label: 'About' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'members', label: 'Members' },
];

const admins = [
  { name: 'John Doe', avatar: '/images/avatar.png', role: 'Admin' },
  { name: 'Jane Smith', avatar: '/images/avt-exp.jpg', role: 'Moderator' },
];
const members = [
  { name: 'Alice', avatar: '/images/avatar.png' },
  { name: 'Bob', avatar: '/images/avt-exp.jpg' },
  { name: 'Charlie', avatar: '/images/avatar.png' },
  { name: 'David', avatar: '/images/avt-exp.jpg' },
  { name: 'Eve', avatar: '/images/avatar.png' },
  { name: 'Frank', avatar: '/images/avt-exp.jpg' },
  { name: 'Grace', avatar: '/images/avatar.png' },
  { name: 'Heidi', avatar: '/images/avt-exp.jpg' },
  { name: 'Ivan', avatar: '/images/avatar.png' },
  { name: 'Judy', avatar: '/images/avt-exp.jpg' },
];

export default function GroupDetail() {
  const [activeTab, setActiveTab] = React.useState('about');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [joinedDropdownOpen, setJoinedDropdownOpen] = React.useState(false);
  const joinedDropdownRef = useRef(null);
  const searchParams = useSearchParams();
  const isManager = searchParams.get('from') === 'manage';
  const isDiscover = searchParams.get('from') === 'discover';

  // Close joined dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (joinedDropdownRef.current && !joinedDropdownRef.current.contains(event.target)) {
        setJoinedDropdownOpen(false);
      }
    }
    if (joinedDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [joinedDropdownOpen]);

  return (
    <div className="mx-auto mt-6 flex max-w-7xl gap-8 px-2 md:px-6">
      {/* Sidebar (sticky) */}

      {/* Main Content */}
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white shadow-md dark:bg-zinc-900">
        {/* Cover Image */}
        <div className="relative h-64 w-full md:h-80 lg:h-96">
          <Image
            src={group.cover}
            alt={group.name}
            fill
            className="h-full w-full rounded-lg object-cover shadow-lg"
            priority
          />
        </div>
        {/* Group Name & Info */}
        <div className="px-6 pb-2 pt-6">
          <h1 className="mb-1 text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            {group.name}
          </h1>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            <span>{group.members.toLocaleString()} members</span>
            <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs font-medium dark:border-zinc-700">
              {group.privacy}
            </span>
          </div>
          {/* Button Row */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex -space-x-3">
              {group.avatars.map((avatar, idx) => (
                <Image
                  key={idx}
                  src={avatar}
                  alt="Member avatar"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white shadow-sm dark:border-zinc-900"
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {isManager ? (
                <>
                  <button
                    className="rounded-full bg-zinc-800 px-16 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-offset-zinc-900"
                    onClick={() => setInviteOpen(true)}
                  >
                    Invite
                  </button>

                  <div className="relative">
                    <div className="relative">
                      <button
                        className="rounded-full text-neutral-800 transition-all hover:text-zinc-400 dark:text-zinc-50 dark:hover:text-zinc-500"
                        onClick={() => setDropdownOpen((v) => !v)}
                        aria-label="Options"
                      >
                        <i className="fa-solid fa-ellipsis"></i>
                      </button>
                    </div>

                    {dropdownOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-zinc-700">
                        <button className="block w-full px-4 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800">
                          Edit Group
                        </button>
                        <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          Delete Group
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : isDiscover ? (
                <button className="flex items-center justify-center gap-2 rounded-full bg-zinc-800 px-16 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-offset-zinc-900">
                  Join
                </button>
              ) : (
                <>
                  <button
                    className="flex cursor-default items-center justify-center gap-2 rounded-full bg-zinc-800 px-6 py-2 text-sm font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-neutral-800"
                    disabled
                  >
                    <i className="fa-solid fa-people-group"></i>
                    Joined
                  </button>

                  <div className="relative" ref={joinedDropdownRef}>
                    <button
                      className="rounded-fullp-2 ml-1 text-neutral-800 transition-all hover:text-zinc-400 dark:text-zinc-50 dark:hover:text-zinc-500"
                      onClick={() => setJoinedDropdownOpen((v) => !v)}
                      aria-label="Joined options"
                    >
                      <i className="fa-solid fa-ellipsis"></i>
                    </button>
                    {joinedDropdownOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-36 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-zinc-700">
                        <button
                          className="block w-full px-4 py-2 text-left text-sm font-normal text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => {
                            setJoinedDropdownOpen(false);
                            // Add leave group logic here
                          }}
                        >
                          <i className="fa-solid fa-right-from-bracket mr-2"></i>
                          Leave Group
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Invite Modal */}
        {inviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Invite Friends
              </h2>
              <input
                type="text"
                placeholder="Search friends..."
                className="mb-4 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
              />
              <div className="mb-4 text-neutral-500 dark:text-neutral-400">
                (Friend list goes here)
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button className="rounded-lg bg-zinc-800 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-offset-zinc-900">
                  Send Invites
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Divider */}
        <hr className="border-neutral-200 dark:border-zinc-700" />
        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-white px-6 pt-2 dark:bg-zinc-900">
          <div className="flex gap-6 border-b border-neutral-200 dark:border-zinc-700">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`relative px-1 py-3 text-sm font-medium text-zinc-800 transition-all dark:text-zinc-100 ${
                  activeTab === tab.key
                    ? 'border-b-2 border-zinc-800 dark:border-zinc-100'
                    : 'border-b-2 border-transparent text-neutral-400'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-zinc-800 transition-all dark:bg-zinc-100" />
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        <div className="px-6 py-6">
          {activeTab === 'about' && (
            <div className="text-base text-zinc-800 dark:text-zinc-100">
              <h2 className="mb-2 font-semibold">About this group</h2>
              <p className="text-neutral-500 dark:text-neutral-400">{group.description}</p>
            </div>
          )}
          {activeTab === 'discussion' && (
            <div className="text-neutral-500 dark:text-neutral-400">
              Group posts will appear here.
            </div>
          )}
          {activeTab === 'members' && (
            <div className="mx-auto max-w-2xl">
              {/* Top Section: Heading, Search, HR */}
              <div className="mb-2">
                <div className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  Members · {group.members.toLocaleString()}
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  className="mb-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
                />
                <hr className="border-neutral-200 dark:border-zinc-700" />
              </div>
              {/* Admins/Moderators Block */}
              <div className="mb-2">
                {admins.map((admin, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2">
                    <img
                      src={admin.avatar}
                      className="h-10 w-10 rounded-full shadow"
                      alt={admin.name}
                    />
                    <div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-100">{admin.name}</p>
                      <p className="text-sm text-neutral-500">{admin.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-neutral-200 dark:border-zinc-700" />
              {/* Regular Members Section */}
              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold uppercase text-neutral-500">Members</div>
                <div className="scrollbar-thin scrollbar-thumb-zinc-400 max-h-72 overflow-y-auto pr-2">
                  {members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-2">
                      <img
                        src={member.avatar}
                        className="h-10 w-10 rounded-full shadow"
                        alt={member.name}
                      />
                      <div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-100">
                          {member.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
