'use client';

import React, { useMemo } from 'react';
import FollowNotification from '../sidebar/_components/follow-notification';
import LikeNotification from '../sidebar/_components/like-notification';
import CommentNotification from '../sidebar/_components/comment-notification';
import { TagNotification } from '../sidebar/_components/tag-notification';
import ReportApprovedNotification from '../sidebar/_components/report-approved-notification';
import AccountSuspendedNotification from '../sidebar/_components/account-suspended-notification';
import AccountBannedNotification from '../sidebar/_components/account-banned-notification';
import PostReportNotification from '../sidebar/_components/post-report-notification';
import CommentReportNotification from '../sidebar/_components/comment-report-notification';
import UserReportNotification from '../sidebar/_components/user-report-notification';
import { getNotificationProps, isValidNotification } from '@/src/utils/notification.util';

const NotificationGroup = ({ notifications, onNotificationClick }) => {
  // ✅ REFACTORED: Component mapping with better organization
  const notificationComponents = useMemo(() => ({
    follow: FollowNotification,
    like: LikeNotification,
    comment: CommentNotification,
    tag: TagNotification,
    report_approved: ReportApprovedNotification,
    account_suspended: AccountSuspendedNotification,
    account_banned: AccountBannedNotification,
    post_report: PostReportNotification,
    comment_report: CommentReportNotification,
    user_report: UserReportNotification,
  }), []);

  // ✅ REFACTORED: Render notification with cleaner logic
  const renderNotification = useMemo(() => (notification) => {
    if (!isValidNotification(notification)) return null;

    const type = notification.type.toLowerCase();
    const Component = notificationComponents[type];
    
    if (!Component) return null;

    // Special case for TagNotification (different props)
    if (type === 'tag') {
      return <Component key={notification.id} isSeen={notification.isRead === true} />;
    }

    return <Component key={notification.id} {...getNotificationProps(notification, onNotificationClick)} />;
  }, [notificationComponents, onNotificationClick]);

  // ✅ REFACTORED: Empty state component
  const EmptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-8">
      <i className="fa-solid fa-bell text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
      <p className="text-center text-gray-400 dark:text-gray-600">
        No notifications yet
      </p>
      <p className="text-center text-sm text-gray-300 dark:text-gray-700 mt-2">
        When you get notifications, they&apos;ll show up here
      </p>
    </div>
  ), []);

  // ✅ REFACTORED: Early return for empty state
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return EmptyState;
  }

  return (
    <div className="space-y-2">
      {notifications.map(renderNotification)}
    </div>
  );
};

export default NotificationGroup; 