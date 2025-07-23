'use client';
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsQueryApi } from '@/src/apis/groups/query/groups.query.api';
import { groupsCommandApi } from '@/src/apis/groups/command/groups.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { addToast } from '@heroui/toast';
import { getUser } from '@/src/utils/auth.util';

const tabs = [
  { key: 'about', label: 'About' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'members', label: 'Members' },
];

export default function GroupDetail() {
  const [activeTab, setActiveTab] = useState('about');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [joinedDropdownOpen, setJoinedDropdownOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const joinedDropdownRef = useRef(null);
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const groupId = params.groupId;
  const isManager = searchParams.get('from') === 'manage';
  const isDiscover = searchParams.get('from') === 'discover';

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch group details
  const { data: group, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.GROUPS, groupId],
    queryFn: () => groupsQueryApi.getGroupById(groupId),
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: membersData } = useQuery({
    queryKey: [QUERY_KEYS.GROUPS, groupId, 'members'],
    queryFn: () => groupsQueryApi.getGroupMembers(groupId),
    enabled: !!groupId && activeTab === 'members',
  });

  // Check if user is member of the group
  const { data: membershipData } = useQuery({
    queryKey: [QUERY_KEYS.GROUPS, groupId, 'membership'],
    queryFn: () => groupsQueryApi.checkGroupMembership(groupId),
    enabled: !!groupId,
    retry: false,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: (groupId) => {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      return groupsCommandApi.joinGroup(groupId, currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS, groupId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_GROUPS] });
      addToast({
        title: 'Success',
        description: 'You have joined the group successfully.',
        timeout: 3000,
        color: 'success',
      });
      setIsMember(true);
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: error.message === 'User not authenticated' 
          ? 'Please log in to join groups' 
          : 'Failed to join group. Please try again.',
        timeout: 3000,
        color: 'danger',
      });
      console.error('Error joining group:', error);
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: (groupId) => groupsCommandApi.leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS, groupId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_GROUPS] });
      addToast({
        title: 'Success',
        description: 'You have left the group successfully.',
        timeout: 3000,
        color: 'success',
      });
      setIsMember(false);
      setJoinedDropdownOpen(false);
      router.push('/groups/your-groups');
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

  // Update membership status when data changes
  useEffect(() => {
    if (membershipData) {
      setIsMember(membershipData.member || false);
      setIsOwner(membershipData.owner || false);
    } else {
      // If membership check is not available, check if user is in memberIds
      if (group && currentUser && group.memberIds) {
        const userIsMember = group.memberIds.includes(currentUser.id);
        setIsMember(userIsMember);
        // For now, assume not owner if we can't determine from membership data
        setIsOwner(false);
      } else {
        setIsMember(false);
        setIsOwner(false);
      }
    }
  }, [membershipData, group, currentUser]);

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

  const handleJoinGroup = () => {
    if (!currentUser?.id) {
      addToast({
        title: 'Authentication Required',
        description: 'Please log in to join groups.',
        timeout: 3000,
        color: 'warning',
      });
      return;
    }
    joinGroupMutation.mutate(groupId);
  };

  const handleLeaveGroup = () => {
    leaveGroupMutation.mutate(groupId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto mt-6 flex max-w-7xl gap-8 px-2 md:px-6">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white shadow-md dark:bg-zinc-900">
          <div className="p-6 text-center text-gray-500">Loading group details...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto mt-6 flex max-w-7xl gap-8 px-2 md:px-6">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white shadow-md dark:bg-zinc-900">
          <div className="p-6 text-center text-red-500">
            Error loading group: {error.message}
          </div>
        </div>
      </div>
    );
  }

  // No group data
  if (!group) {
    return (
      <div className="mx-auto mt-6 flex max-w-7xl gap-8 px-2 md:px-6">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white shadow-md dark:bg-zinc-900">
          <div className="p-6 text-center text-gray-500">Group not found</div>
        </div>
      </div>
    );
  }

  // Calculate member count - ensure it's at least 1 (the owner)
  const memberCount = Math.max(group.memberIds ? group.memberIds.length : 1, 1);
  const members = membersData?.members || [];

  return (
    <div className="mx-auto mt-6 flex max-w-7xl gap-8 px-2 md:px-6">
      {/* Main Content */}
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white shadow-md dark:bg-zinc-900">
        {/* Cover Image */}
        <div className="relative h-64 w-full md:h-80 lg:h-96">
          <Image
            src={group.coverImageUrl || '/images/unify_icon_lightmode.svg'}
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
            <span>{memberCount.toLocaleString()} members</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              group.privacyType === 'PUBLIC' 
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-neutral-300 dark:border-zinc-700'
            }`}>
              {group.privacyType || 'Public'}
            </span>
            {group.status && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                group.status === 'ACTIVE'
                  ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : 'border-neutral-300 dark:border-zinc-700'
              }`}>
                {group.status}
              </span>
            )}
          </div>
          {/* Button Row */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex -space-x-3">
              {/* Show first few member avatars if available */}
              {members.slice(0, 5).map((member, idx) => (
                <div
                  key={member.id || idx}
                  className="h-10 w-10 rounded-full border-2 border-white bg-zinc-200 shadow-sm dark:border-zinc-900 dark:bg-zinc-700 overflow-hidden"
                >
                  {member.avatarUrl && (
                    <Image
                      src={member.avatarUrl}
                      alt={member.username || `Member ${idx + 1}`}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {isOwner || isMember ? (
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
              ) : isMember ? (
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
                          onClick={handleLeaveGroup}
                          disabled={leaveGroupMutation.isPending}
                        >
                          <i className="fa-solid fa-right-from-bracket mr-2"></i>
                          {leaveGroupMutation.isPending ? 'Leaving...' : 'Leave Group'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  className="flex items-center justify-center gap-2 rounded-full bg-zinc-800 px-16 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-zinc-400 dark:hover:text-zinc-50 dark:focus:ring-offset-zinc-900"
                  onClick={handleJoinGroup}
                  disabled={joinGroupMutation.isPending}
                >
                  {joinGroupMutation.isPending ? 'Joining...' : 'Join'}
                </button>
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
              <p className="text-neutral-500 dark:text-neutral-400">
                {group.description || 'No description available.'}
              </p>
              {group.createdAt && (
                <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  Created: {new Date(group.createdAt).toLocaleDateString()}
                </div>
              )}
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
                  Members · {memberCount.toLocaleString()}
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  className="mb-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
                />
                <hr className="border-neutral-200 dark:border-zinc-700" />
              </div>
              {/* Members Section */}
              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold uppercase text-neutral-500">Members</div>
                <div className="scrollbar-thin scrollbar-thumb-zinc-400 max-h-72 overflow-y-auto pr-2">
                  {members.length > 0 ? (
                    members.map((member, idx) => (
                      <div key={member.id || idx} className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 rounded-full bg-zinc-200 shadow dark:bg-zinc-700 overflow-hidden">
                          {member.avatarUrl && (
                            <Image
                              src={member.avatarUrl}
                              alt={member.username || `Member ${idx + 1}`}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-800 dark:text-zinc-100">
                            {member.username || member.firstName + ' ' + member.lastName || `Member ${idx + 1}`}
                          </p>
                          {member.role && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {member.role}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-neutral-500 dark:text-neutral-400 py-4">
                      {memberCount > 0 ? 'Loading members...' : 'No members found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
