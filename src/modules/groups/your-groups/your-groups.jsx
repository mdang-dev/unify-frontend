'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/src/components/ui/popover';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsQueryApi } from '@/src/apis/groups/query/groups.query.api';
import { groupsCommandApi } from '@/src/apis/groups/command/groups.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { addToast } from '@heroui/toast';

export default function YourGroups() {
  const [openPopover, setOpenPopover] = useState(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch user's groups
  const { data: groups, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.MY_GROUPS],
    queryFn: () => groupsQueryApi.getMyGroups(),
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: (groupId) => groupsCommandApi.leaveGroup(groupId),
    onSuccess: () => {
      // Invalidate and refetch my groups
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_GROUPS] });
      addToast({
        title: 'Success',
        description: 'You have left the group successfully.',
        timeout: 3000,
        color: 'success',
      });
      setOpenPopover(null);
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: 'Failed to leave group. Please try again.',
        timeout: 3000,
        color: 'danger',
      });
      console.error('Error leaving group:', error);
    },
  });

  const handleLeaveGroup = (groupId) => {
    leaveGroupMutation.mutate(groupId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Your Groups</h2>
        <div className="text-center text-gray-500">Loading your groups...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Your Groups</h2>
        <div className="text-center text-red-500">
          Error loading groups: {error.message}
        </div>
      </div>
    );
  }

  // Empty state
  if (!groups || groups.length === 0) {
    return (
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Your Groups</h2>
        <div className="text-center text-gray-500">
          <p className="mb-4">You haven&apos;t joined any groups yet.</p>
          <button
            onClick={() => router.push('/groups/discover')}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-zinc-600"
          >
            Discover Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Your Groups</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className="relative h-32 w-full cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <Image
                src={group.coverImageUrl || '/images/unify_icon_lightmode.svg'}
                alt={group.name}
                fill
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
                priority={false}
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div
                className="mb-1 cursor-pointer truncate text-lg font-semibold text-zinc-800 dark:text-zinc-100"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                {group.name}
              </div>
              <div className="mb-2 text-sm text-neutral-400 dark:text-zinc-400">
                {group.memberIds ? group.memberIds.length.toLocaleString() : '0'} members
              </div>
              {group.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="mt-auto flex gap-2">
                <button
                  className="mt-auto w-full rounded-lg bg-zinc-800 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-zinc-600"
                  onClick={() => router.push(`/groups/${group.id}`)}
                >
                  View group
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
                    <button
                      className="block w-full px-4 py-2 text-left text-sm font-normal text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => handleLeaveGroup(group.id)}
                      disabled={leaveGroupMutation.isPending}
                    >
                      <i className="fa-solid fa-right-from-bracket mr-2"></i>
                      {leaveGroupMutation.isPending ? 'Leaving...' : 'Leave Group'}
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
