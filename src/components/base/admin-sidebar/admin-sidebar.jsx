'use client';

import React from 'react';
import Link from 'next/link';
import UnifyLogo from '../full-unify-logo';
import { Accordion, AccordionItem, Avatar, Divider, User } from '@heroui/react';
import NavButton from './_components/nav-button';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth.store';
import { useRouter } from 'next/navigation';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { deleteCookie } from '@/src/utils/cookies.util';
import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

const AdminSidebar = () => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const defaultAvatar = '/images/unify_icon_2.svg';
  const queryClient = useQueryClient();

  const logoutUser = async () => {
    try {
      // Try to call logout API, but don't fail if it doesn't work
      await authCommandApi.logout();
    } catch (error) {
      console.warn('Logout API failed, proceeding with client-side logout:', error);
    }
    
    // Always clear local data and redirect
    deleteCookie(COOKIE_KEYS.AUTH_TOKEN);
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
    setUser(null);
    router.push('/login');
  };

  return (
    <div className="relative flex flex-row">
      <div className="fixed left-0 top-0 flex h-screen flex-col border border-none bg-gray-200 p-3 dark:border-neutral-500 dark:bg-neutral-800">
        <UnifyLogo className="mx-auto w-52" />
        <Divider className="mb-2 mt-5" />
        <div className="flex w-full justify-between">
          <User
            avatarProps={{
              src: `${user?.avatar?.url}` || defaultAvatar,
            }}
            description={`Admin`}
            name={`${user?.firstName || ''} ${user?.lastName || ''}`}
            className="my-3 justify-start !opacity-100"
          />
          <div>{/* <Avatar src={account?.avatar?.url} /> */}</div>
          <Link
            href={''}
            className="my-auto text-xl text-zinc-500 hover:text-red-500"
            onClick={logoutUser}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </Link>
        </div>
        <Divider className="mt-2" />
        <div className="no-scrollbar flex w-60 grow flex-col overflow-y-auto">
          <Accordion variant="light" className="w-full">
            <AccordionItem
              className="font-bold"
              key="1"
              aria-label="Users"
              title="USERS"
              startContent={<i className="fa-solid fa-users"></i>}
            >
              <div className="pl-5 font-light">
                <ul>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-user-xmark"
                      text="Reported Users"
                      href="/manage/users/reports"
                    />
                  </li>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-ban"
                      text="Blocked Users"
                      href="/manage/users/list"
                    />
                  </li>
                </ul>
              </div>
            </AccordionItem>
            <AccordionItem
              key="2"
              className="font-bold"
              aria-label=""
              title="POSTS"
              startContent={<i className="fa-solid fa-blog"></i>}
            >
              <div className="pl-5 font-light">
                <ul>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-triangle-exclamation"
                      text="Reported Posts"
                      href="/manage/posts/list"
                    />
                  </li>
                </ul>
              </div>
            </AccordionItem>
            <AccordionItem
              key="3"
              className="font-bold"
              aria-label=""
              title="COMMENTS"
              startContent={<i className="fa-solid fa-comment"></i>}
            >
              <div className="font-light">
                <ul>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-comment-slash"
                      text="Reported Comments"
                      href="/manage/comments/list"
                    />
                  </li>
                </ul>
              </div>
            </AccordionItem>
            {/* <AccordionItem key="3" aria-label="" className="font-bold" title="GROUPS" startContent={<i className="fa-solid fa-users-rays"></i>}>
              <div className="pl-5 font-light">
                <ul>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-circle-exclamation"
                      text="Reported Groups"
                      href="/manage/groups/list"
                    />
                  </li>
                </ul>
              </div>
            </AccordionItem> */}
            {/* <AccordionItem key="4" aria-label="" className="font-bold" title="STATISTICS" startContent={<i className="fa-solid fa-square-poll-vertical"></i>}>
              <div className="pl-5 font-light">
                <ul>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-chart-pie"
                      text="Trends"
                      href="/statistics/posts"
                    />
                  </li>
                  <li>
                    <NavButton
                      iconClass="fa-regular fa-handshake"
                      text="New Users"
                      href="/statistics/users"
                    />
                  </li>
                </ul>
              </div>
            </AccordionItem>
            <AccordionItem key="5" aria-label="" className="font-bold" title="UNIFY STAFFS" startContent={<i className="fa-solid fa-u"></i>}>
              <div className="pl-5 font-light">
                <ul>
                  <li>
                    <NavButton
                      iconClass="fa-solid fa-clipboard-user"
                      text="All Staffs"
                      href="/manage/users/list"
                    />
                  </li>
                </ul>
              </div>
            </AccordionItem> */}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
