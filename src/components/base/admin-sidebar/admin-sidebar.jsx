'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth.store';
import { useRouter } from 'next/navigation';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { deleteCookie } from '@/src/utils/cookies.util';
import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/src/components/ui/sidebar';
import { Avatar, User } from '@heroui/react';
import UnifyLogo from '../full-unify-logo';

const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const defaultAvatar = '/images/unify_icon_2.png';
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

  // Menu items configuration
  const menuItems = [
    {
      title: 'DASHBOARD',
      icon: 'fa-solid fa-chart-line',
      items: [
        {
          title: 'Overview',
          icon: 'fa-solid fa-tachometer-alt',
          href: '/dashboard',
        },
      ],
    },
    {
      title: 'USERS',
      icon: 'fa-solid fa-users',
      items: [
        {
          title: 'User List',
          icon: 'fa-solid fa-user',
          href: '/manage/users/list',
        },
        {
          title: 'Reported Users',
          icon: 'fa-solid fa-user-xmark',
          href: '/manage/users/reports',
        },
      ],
    },
    {
      title: 'POSTS',
      icon: 'fa-solid fa-blog',
      items: [
        {
          title: 'Post List',
          icon: 'fa-solid fa-file-lines',
          href: '/manage/posts/list',
        },
        {
          title: 'Reported Posts',
          icon: 'fa-solid fa-triangle-exclamation',
          href: '/manage/posts/reports',
        },
      ],
    },
    {
      title: 'COMMENTS',
      icon: 'fa-solid fa-comment',
      items: [
        {
          title: 'Pending Comments',
          icon: 'fa-solid fa-comments',
          href: '/manage/comments/list',
        },
        {
          title: 'Processed Comments',
          icon: 'fa-solid fa-check-circle',
          href: '/manage/comments/processed',
        },
      ],
    },
  ];

  // Function to check if a section is active
  const isSectionActive = (sectionItems) => {
    return sectionItems.some((item) => pathname === item.href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center p-4">
          <UnifyLogo className="w-40 group-data-[collapsible=icon]:w-8" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center gap-2 p-2">
              <User
                avatarProps={{
                  src: `${user?.avatar?.url}` || defaultAvatar,
                }}
                description="Admin"
                name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                className="flex-1 group-data-[collapsible=icon]:hidden"
              />
              <button
                onClick={logoutUser}
                className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title="Logout"
              >
                <i className="fa-solid fa-right-from-bracket text-sm" />
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {menuItems.map((group, groupIndex) => {
          const isActive = isSectionActive(group.items);
          return (
            <SidebarGroup key={groupIndex}>
              <SidebarGroupLabel
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70'
                }`}
              >
                <i className={`${group.icon} text-sm`} />
                <span className="group-data-[collapsible=icon]:hidden">{group.title}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item, itemIndex) => (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.href} className="flex items-center gap-2">
                          <i className={`${item.icon} text-sm`} />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2 text-xs text-sidebar-foreground/70">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <span className="group-data-[collapsible=icon]:hidden">Admin Panel</span>
            <span className="group-data-[collapsible=icon]:hidden">v1.0.0</span>
            <div className="hidden group-data-[collapsible=icon]:block">
              <i className="fa-solid fa-shield-halved text-sm" />
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
