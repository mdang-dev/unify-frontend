'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ProfileTabs from '../_components/profile-tab';
import { addToast, ToastProvider } from '@heroui/toast';
import { useFollow } from '@/src/hooks/use-follow';
import AvatarDefault from '@/public/images/unify_icon_2.png';
import ReportUserModal from '../_components/report-user-modal';
import { FollowButton } from '@/src/components/button';
import { useCreateReport } from '@/src/hooks/use-report';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth.store';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import NavButton from '../_components/nav-button';
const OthersProfile = () => {
  const t = useTranslations('OthersProfile');
  const [activeTab, setActiveTab] = useState('post');
  const [userReels, setUserReels] = useState([]);
  const [openList, setOpenList] = useState(false);

  const { username } = useParams();

  const createUserReport = useCreateReport();
  const user = useAuthStore((s) => s.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openReportModal = () => {
    setIsModalOpen(true);
    setOpenList(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const { data: userInfo, isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE_BY_USERNAME, username],
    queryFn: () => userQueryApi.getInfoByUsername(username),
    enabled: !!username,
  });

  const { followersCount = 0, followingCount = 0 } = useFollow(user?.id, userInfo?.id);

  const handleReportUser = useCallback(
    async (data, reason, urls = []) => {
      createUserReport.mutate(
        { endpoint: 'user', reportedId: data, reason: reason, urls: urls },
        {
          onSuccess: () => {
            addToast({
              title: t('ReportUser.Success'),
              description: t('ReportUser.ReportUserSuccessful'),
              timeout: 3000,

              color: 'success',
            });
            setIsModalOpen(false);
          },
          onError: (error) => {
            let errorMessage = 'Unknown error';
            let errorColor = 'danger';

            if (error.response) {
              const { status, data } = error.response;
              errorMessage = data?.detail || error.message || 'Unknown error';

              if (
                (status === 400 || status === 409) &&
                (errorMessage === 'You cannot report your own content.' ||
                  errorMessage === 'You have already reported this content.')
              ) {
                errorColor = 'warning';
                console.warn('Report warning:', errorMessage);
              } else {
                errorColor = 'danger';
                console.error('Report error:', error);
              }
            } else {
              errorMessage = 'Failed to connect to the server.';
              console.error('Report error:', error);
            }

            addToast({
              title: t('ReportUser.FailToReportUser'),
              description: errorMessage,
              timeout: 3000,
              color: errorColor,
            });

            setIsModalOpen(false);
          },
        }
      );
    },
    [createUserReport]
  );

  if (loading) return <p className="text-center text-gray-500">{t('Loading')}</p>;

  return (
    <>
    {/* <ToastProvider placement={'top-right'} /> */}
      <div className="mx-auto max-w-4xl py-6">
        {/* Profile Header */}
        <div className="flex px-4 sm:px-6">
          {/* Avatar */}

          <div className="h-36 w-36 flex-shrink-0 sm:h-48 sm:w-48">
            <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-gray-300">
              {userInfo?.avatar?.url ? (
                <Image
                  src={userInfo.avatar.url}
                  alt="Avatar"
                  width={154}
                  height={154}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src="/images/unify_icon_2.png"
                  alt="Default Avatar"
                  width={154}
                  height={154}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Profile Info */}

          <div className="ml-12 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="max-w-[200px] truncate text-2xl font-normal text-neutral-800 dark:text-white">
                {userInfo.username}
              </h3>
              <NavButton onClick={() => setOpenList(true)} iconClass="fa-solid fa-ellipsis" />
            </div>

            {/* Stats */}
            <div className="mt-4 flex space-x-6">
              <div className="text-center">
                <span className="font-bold text-neutral-800 dark:text-white">
                  {userInfo.posts || 0}
                </span>{' '}
                <span className="font-bold text-gray-500 dark:text-gray-300">{t('Posts')}</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-neutral-800 dark:text-white">{followersCount}</span>{' '}
                <span className="font-bold text-gray-500 dark:text-gray-300">{t('Followers')}</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-neutral-800 dark:text-white">{followingCount}</span>{' '}
                <span className="font-bold text-gray-500 dark:text-gray-300">{t('Following')}</span>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 text-sm font-semibold text-neutral-800 dark:text-white">
              “{userInfo.biography}”
            </p>

            <div className="mt-4 flex space-x-2">
              <FollowButton
                userId={user?.id}
                followingId={userInfo?.id}
                classFollow="bg-red-500 font-bold py-2 px-8 rounded-lg w-full text-white text-md"
                classFollowing="bg-gray-700 hover:bg-gray-600 font-bold py-2 px-8 rounded-lg w-full text-white text-md"
                contentFollow={t('Follow')}
                contentFollowing={t('Unfollow')}
              />
              <Link
                href={{
                  pathname: `/messages`,
                  query: {
                    userId: userInfo.id,
                    username: userInfo.username,
                    avatar: userInfo.avatar?.url || AvatarDefault?.src,
                    fullname: userInfo.firstName + ' ' + userInfo.lastName,
                  },
                }}
                className="flex w-full items-center justify-center rounded-lg bg-gray-200 px-4 py-2 font-bold transition-colors hover:bg-zinc-400 dark:bg-neutral-700 dark:hover:bg-gray-600"
              >
                <i className="fa-brands fa-facebook-messenger mr-2"></i>
                <span>{t('Message')}</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-300 dark:border-neutral-600">
          <div className="flex justify-center space-x-12">
            <button
              className={`flex items-center py-3 text-sm font-medium ${
                activeTab === 'post'
                  ? 'border-t-2 border-neutral-800 text-neutral-900 dark:border-white dark:text-white'
                  : 'text-neutral-900 dark:text-white'
              }`}
              onClick={() => setActiveTab('post')}
            >
              <i className="fa-solid fa-table-cells mr-2"></i>
              POST
            </button>
            <button
              className={`flex items-center py-3 text-sm font-medium ${
                activeTab === 'reel'
                  ? 'border-t-2 border-neutral-800 text-neutral-900 dark:border-white dark:text-white'
                  : 'text-neutral-900 dark:text-white'
              }`}
              onClick={() => setActiveTab('reel')}
            >
              <i className="fa-solid fa-film mr-2"></i>
              REEL
            </button>
          </div>
        </div>

        <div className="mt-4">
          <ProfileTabs activeTab={activeTab} username={username} userReels={userReels} />
        </div>

        {openList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="w-72 rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
              <button
                className="w-full rounded-t-xl py-3.5 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                // onClick={() => handleReportUser(userInfo.id)}
                onClick={openReportModal}
              >
                {t('Report')}
              </button>
              <button className="w-full py-3.5 text-sm font-semibold text-neutral-800 transition-all duration-200 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-neutral-800">
                {t('Share')}
              </button>
              <button
                onClick={() => setOpenList(false)}
                className="w-full rounded-b-xl py-3.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-neutral-700"
              >
                {t('Close')}
              </button>
            </div>
          </div>
        )}
        <ReportUserModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleReportUser}
          userId={userInfo.id}
        />
      </div>
    </>
  );
};

export default OthersProfile;
