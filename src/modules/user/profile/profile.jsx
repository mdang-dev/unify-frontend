'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FollowerModal from './_components/follower-modal';
import FriendModal from './_components/friend-modal';
import FollowingModal from './_components/following-modal';
import ProfileTabs from '../_components/profile-tab';
import People from './_components/people';
import { useFollow } from '@/src/hooks/use-follow';
import { useAuthStore } from '@/src/stores/auth.store';
import ProfileHeaderSkeleton from './_components/profile-header-skeleton';
import ProfileHeader from './_components/profile-header';
import TabNavigation from './_components/tab-navigation';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('post');
  const [isClient, setIsClient] = useState(false);
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Modal states
  const [isFollowerOpen, setIsFollowerOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [isFriendOpen, setIsFriendOpen] = useState(false);

  // Query for follower and following counts

  const {
    followersCount: followerCount,
    followingCount,
    isLoadingFollowers,
    isLoadingFollowing,
  } = useFollow(0, user?.id);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const handleClickView = () => router.push(`/settings/archive/${params.username}`);
  const handleClickEdit = () => router.push('/settings/edit-profile');

  const stats = {
    friendsCount: user?.friends?.length || 0,
    followerCount,
    followingCount,
    onToggleFriend: () => setIsFriendOpen(!isFriendOpen),
    onToggleFollower: () => setIsFollowerOpen(!isFollowerOpen),
    onToggleFollowing: () => setIsFollowingOpen(!isFollowingOpen),
  };

  const isLoading = isLoadingFollowers || isLoadingFollowing || !user;

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Profile Header */}
      {isLoading ? (
        <ProfileHeaderSkeleton />
      ) : (
        <ProfileHeader
          user={user}
          stats={stats}
          onEdit={handleClickEdit}
          onViewArchive={handleClickView}
        />
      )}

      {/* People Section */}
      <div className="mt-6">
        <People />
      </div>

      {/* Tabs */}
      <div className="mt-6 border-t border-gray-300 dark:border-neutral-700">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <ProfileTabs activeTab={activeTab} username={params.username} />
      </div>

      {/* Modals */}
      <FollowerModal
        isOpen={isFollowerOpen}
        onClose={() => setIsFollowerOpen(false)}
        userId={user?.id}
        currentUserId={user?.id}
      />
      <FollowingModal
        isOpen={isFollowingOpen}
        onClose={() => setIsFollowingOpen(false)}
        userId={user?.id}
        currentUserId={user?.id}
      />
      <FriendModal isOpen={isFriendOpen} onClose={() => setIsFriendOpen(false)} userId={user?.id} />
    </div>
  );
};

export default Profile;
