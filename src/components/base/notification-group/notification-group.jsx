'use client';

import React, { useMemo } from 'react';
import FollowNotification from '../sidebar/_components/follow-notification';
import LikeNotification from '../sidebar/_components/like-notification';
import CommentNotification from '../sidebar/_components/comment-notification';
import { TagNotification } from '../sidebar/_components/tag-notification';

const NotificationGroup = ({ notifications, onNotificationClick }) => {
  // Group notifications by type and time
  const groupedNotifications = useMemo(() => {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    const groups = {};
    
    notifications.forEach(notification => {
      if (!notification || !notification.type) return;
      
      const type = notification.type.toLowerCase();
      const timestamp = new Date(notification.timestamp);
      const timeGroup = getTimeGroup(timestamp);
      
      const key = `${type}_${timeGroup}`;
      
      if (!groups[key]) {
        groups[key] = {
          type,
          timeGroup,
          notifications: [],
          count: 0,
          latestTimestamp: timestamp
        };
      }
      
      groups[key].notifications.push(notification);
      groups[key].count++;
      
      if (timestamp > groups[key].latestTimestamp) {
        groups[key].latestTimestamp = timestamp;
      }
    });

    // Convert to array and sort by latest timestamp
    return Object.values(groups)
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [notifications]);

  const getTimeGroup = (timestamp) => {
    const now = new Date();
    const diffInHours = (now - timestamp) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'recent';
    if (diffInHours < 24) return 'today';
    if (diffInHours < 48) return 'yesterday';
    if (diffInHours < 168) return 'this_week'; // 7 days
    return 'older';
  };

  const getTimeGroupLabel = (timeGroup) => {
    switch (timeGroup) {
      case 'recent': return 'Just now';
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This week';
      case 'older': return 'Earlier';
      default: return 'Unknown';
    }
  };

  const getTypeLabel = (type, count) => {
    const labels = {
      follow: count === 1 ? 'followed you' : `followed you (${count})`,
      like: count === 1 ? 'liked your post' : `liked your posts (${count})`,
      comment: count === 1 ? 'commented on your post' : `commented on your posts (${count})`,
      tag: count === 1 ? 'tagged you in a post' : `tagged you in posts (${count})`
    };
    return labels[type] || `${type} (${count})`;
  };

  const getTypeIcon = (type) => {
    const icons = {
      follow: 'fa-solid fa-user-plus',
      like: 'fa-solid fa-heart',
      comment: 'fa-regular fa-comment',
      tag: 'fa-solid fa-at'
    };
    return icons[type] || 'fa-solid fa-bell';
  };

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

  if (groupedNotifications.length === 0) {
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
    <div className="space-y-6">
      {groupedNotifications.map((group, groupIndex) => (
        <div key={`${group.type}_${group.timeGroup}_${groupIndex}`} className="space-y-3">
          {/* Group Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <i className={`${getTypeIcon(group.type)} text-sm text-gray-500 dark:text-gray-400`}></i>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getTypeLabel(group.type, group.count)}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {getTimeGroupLabel(group.timeGroup)}
            </span>
          </div>

          {/* Grouped Notifications */}
          <div className="space-y-2">
            {group.notifications.map((notification, index) => (
              <div key={notification.id} className="relative">
                {renderNotification(notification)}
                {index < group.notifications.length - 1 && (
                  <div className="absolute left-8 top-12 w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>

          {/* Group Separator */}
          {groupIndex < groupedNotifications.length - 1 && (
            <hr className="border-gray-200 dark:border-gray-700" />
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationGroup; 