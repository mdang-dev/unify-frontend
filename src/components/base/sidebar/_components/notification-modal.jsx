'use client';

import React, { useEffect, useMemo, useState } from 'react';
import FollowNotification from './follow-notification';
import { TagNotification } from './tag-notification';
import { useNotification } from '@/src/hooks/use-notification';

const NotificationModal = ({ isNotificationOpen, modalRef, userId }) => {
  const { notifications, error } = useNotification(userId);

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

  useEffect(() => {}, [notifications]);

  const sortedNotifications = useMemo(() => {
    return Array.isArray(notifications)
      ? [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];
  }, [notifications]);

  const renderNotification = (notification) => {
    if (!notification || !notification.type) {
      return null;
    }

    switch (notification.type.toLowerCase()) {
      case 'follow':
        return (
          <FollowNotification
            key={notification.id}
            isSeen={notification.isRead}
            sender={notification.sender}
            timestamp={notification.timestamp}
          />
        );
      case 'tag':
        return <TagNotification key={notification.id} isSeen={notification.isRead} />;
      default:
        return null;
    }
  };

  if (error) {
    return <div className="mt-10 text-center text-red-500 dark:text-red-400">Error: {error}</div>;
  }

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
        <h1 className="my-4 px-5 text-2xl font-bold">Notifications</h1>

        <div className="no-scrollbar h-[94%] max-h-full space-y-1 overflow-y-auto px-5 pb-5">
          {sortedNotifications.length > 0 ? (
            sortedNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {renderNotification(notification)}
                {index < sortedNotifications.length - 1 && (
                  <hr className="my-5 border-white dark:border-black" />
                )}
              </React.Fragment>
            ))
          ) : (
            <p className="mt-10 text-center text-gray-400 dark:text-gray-600">
              No notifications yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
