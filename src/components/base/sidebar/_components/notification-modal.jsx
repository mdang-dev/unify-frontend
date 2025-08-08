'use client';

import React, { useEffect, useMemo, useState } from 'react';
import FollowNotification from './follow-notification';
import { TagNotification } from './tag-notification';
import LikeNotification from './like-notification';
import CommentNotification from './comment-notification';
import { useNotification } from '@/src/hooks/use-notification';
import { useDesktopNotifications } from '@/src/hooks/use-desktop-notifications';
import NotificationGroup from '../../notification-group';
import NotificationQuickActions from '../../notification-quick-actions';

const NotificationModal = ({ isNotificationOpen, modalRef, userId }) => {
  const { notifications, unreadCount, markAllAsRead, isFetching, handleNotificationClick } = useNotification(userId);
  const { showNotificationByType, requestPermission, permission, isSupported } = useDesktopNotifications();
  const [showGrouped, setShowGrouped] = useState(false);

  const [modalWidth, setModalWidth] = useState(0);

  useEffect(() => {
    if (!userId) {
      console.warn('⚠️ Missing userId for NotificationModal');
    }
  }, [userId]);

  useEffect(() => {
    if (isNotificationOpen) {
      setModalWidth(471); // Open modal
    } else {
      setModalWidth(0); // Close modal
    }
  }, [isNotificationOpen]);

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleActionComplete = (actionType, data) => {
    console.log(`✅ ${actionType} action completed:`, data);
  };

  const handleRequestDesktopNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log('✅ Desktop notifications enabled');
    } else {
      console.log('❌ Desktop notifications denied');
    }
  };

  const sortedNotifications = useMemo(() => {
    return Array.isArray(notifications)
      ? [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];
  }, [notifications]);

  const renderNotification = (notification) => {
    if (!notification || !notification.type) {
      return null;
    }

    const commonProps = {
      isSeen: notification.isRead,
      sender: notification.sender,
      timestamp: notification.timestamp,
      onClick: () => handleNotificationClick(notification),
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



  return (
    <div className="fixed left-20 z-50 flex justify-start border-l bg-black bg-opacity-50 dark:border-transparent">
      <div
        ref={modalRef}
        className={`h-screen max-w-lg overflow-hidden border-r border-neutral-200 bg-white text-black shadow-lg dark:border-transparent dark:bg-neutral-900 dark:text-white ${
          isNotificationOpen ? 'animate-fadeScale' : 'animate-fadeOut'
        } transition-all duration-300 ease-in-out`}
        style={{
          width: modalWidth,
        }}
      >
        {/* ✅ UPDATED: Header with advanced features */}
        <div className="border-b border-gray-200 px-5 py-4 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <div className="flex items-center space-x-2">
              {/* Desktop Notifications Toggle */}
              {isSupported && permission !== 'granted' && (
                <button
                  onClick={handleRequestDesktopNotifications}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Enable desktop notifications"
                >
                  <i className="fa-solid fa-desktop mr-1"></i>
                  Enable Desktop
                </button>
              )}
              
              {/* Grouping Toggle */}
              <button
                onClick={() => setShowGrouped(!showGrouped)}
                className={`text-xs px-2 py-1 rounded ${
                  showGrouped 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                title={showGrouped ? 'Show individual notifications' : 'Group notifications'}
              >
                <i className={`fa-solid ${showGrouped ? 'fa-list' : 'fa-layer-group'} mr-1`}></i>
                {showGrouped ? 'List' : 'Group'}
              </button>
              
              {/* Mark All as Read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  disabled={isFetching}
                >
                  {isFetching ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>
          </div>
          
          {/* Desktop Notification Status */}
          {isSupported && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <i className={`fa-solid fa-desktop mr-1 ${
                permission === 'granted' ? 'text-green-500' : 'text-gray-400'
              }`}></i>
              Desktop notifications: {permission === 'granted' ? 'Enabled' : 'Disabled'}
            </div>
          )}
        </div>

        {/* ✅ UPDATED: Content area with advanced features */}
        <div className="no-scrollbar h-[calc(100%-120px)] max-h-full space-y-1 overflow-y-auto px-5 pb-5 pt-3">
          {isFetching && sortedNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400 dark:text-gray-600">Loading notifications...</div>
            </div>
          ) : sortedNotifications.length > 0 ? (
            showGrouped ? (
              // Grouped view
              <NotificationGroup 
                notifications={sortedNotifications}
                onNotificationClick={handleNotificationClick}
              />
            ) : (
              // Individual view with quick actions
              sortedNotifications.map((notification, index) => (
                <div key={notification.id} className="space-y-2">
                  {renderNotification(notification)}
                  
                  {/* Quick Actions */}
                  <NotificationQuickActions
                    notification={notification}
                    currentUserId={userId}
                    onActionComplete={handleActionComplete}
                  />
                  
                  {index < sortedNotifications.length - 1 && (
                    <hr className="my-5 border-white dark:border-black" />
                  )}
                </div>
              ))
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <i className="fa-solid fa-bell text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p className="text-center text-gray-400 dark:text-gray-600">
                No notifications yet
              </p>
              <p className="text-center text-sm text-gray-300 dark:text-gray-700 mt-2">
                When you get notifications, they&apos;ll show up here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
