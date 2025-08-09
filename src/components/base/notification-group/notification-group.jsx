'use client';

import React from 'react';
import FollowNotification from '../sidebar/_components/follow-notification';
import LikeNotification from '../sidebar/_components/like-notification';
import CommentNotification from '../sidebar/_components/comment-notification';
import { TagNotification } from '../sidebar/_components/tag-notification';

const NotificationGroup = ({ notifications, onNotificationClick }) => {
  const renderNotification = (notification) => {
    if (!notification || !notification.type) {
      return null;
    }

    const commonProps = {
      isSeen: notification.isRead,
      sender: notification.sender,
      timestamp: notification.timestamp,
      onClick: () => onNotificationClick(notification),
    };

    switch (notification.type.toLowerCase()) {
      case 'follow':
        return <FollowNotification key={notification.id} {...commonProps} />;
      case 'like':
        return <LikeNotification key={notification.id} {...commonProps} />;
      case 'comment':
        return <CommentNotification key={notification.id} {...commonProps} />;
      case 'tag':
        return <TagNotification key={notification.id} isSeen={notification.isRead} />;
      default:
        return null;
    }
  };

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <i className="fa-solid fa-bell text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p className="text-center text-gray-400 dark:text-gray-600">
          No notifications yet
        </p>
        <p className="text-center text-sm text-gray-300 dark:text-gray-700 mt-2">
          When you get notifications, they&apos;ll show up here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div key={notification.id}>
          {renderNotification(notification)}
        </div>
      ))}
    </div>
  );
};

export default NotificationGroup; 