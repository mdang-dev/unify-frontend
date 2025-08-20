'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import FollowNotification from './follow-notification';
import { TagNotification } from './tag-notification';
import LikeNotification from './like-notification';
import CommentNotification from './comment-notification';
import { useNotification } from '@/src/hooks/use-notification';
import { useDesktopNotifications } from '@/src/hooks/use-desktop-notifications';
import { getNotificationProps, isValidNotification } from '@/src/utils/notification.util';
import dynamic from 'next/dynamic';

const PostDetailModal = dynamic(() => import('../../post-detail-modal'), { ssr: false });

const NotificationModal = ({ isNotificationOpen, modalRef, userId }) => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAllAsReadSilently,
    markAsRead, 
    isFetching,
    setModalOpen
  } = useNotification(userId);
  const { requestPermission, permission, isSupported } = useDesktopNotifications();
  
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [modalWidth, setModalWidth] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  useEffect(() => {
    setModalWidth(isNotificationOpen ? 471 : 0);
    
    if (isNotificationOpen && !prevIsOpen && unreadCount > 0) {
      markAllAsReadSilently();
      setModalOpen(true);
    }
    
    setPrevIsOpen(isNotificationOpen);
  }, [isNotificationOpen, unreadCount, markAllAsReadSilently, setModalOpen, prevIsOpen]);

  useEffect(() => {
    if (!isNotificationOpen && prevIsOpen) {
      setModalOpen(false);
      
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
  }, [isNotificationOpen, unreadCount, markAllAsRead, setModalOpen, prevIsOpen]);

  const handleRequestDesktopNotifications = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log('Desktop notifications enabled');
    } else {
      console.log('Desktop notifications denied');
    }
  }, [requestPermission]);

  const sortedNotifications = useMemo(() => {
    return Array.isArray(notifications)
      ? [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];
  }, [notifications]);

  const parseNotificationData = useCallback((notification) => {
    let postId = null;
    let commentId = null;

    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        postId = data.postId || null;
        commentId = data.commentId || null;
      } catch (e) {
        console.warn('[NotificationModal] Failed to parse data field:', e);
      }
    }

    if (!postId) {
      postId = notification?.data?.postId || 
               notification?.data?.post?.id || 
               notification?.postId || 
               notification?.post?.id || 
               null;

      if (!postId && notification.link) {
        try {
          const path = new URL(notification.link, window.location.origin).pathname;
          const match = path.match(/\/posts\/([^\/?#]+)/);
          if (match) postId = match[1];
        } catch {}
      }
    }

    if (!commentId && ['comment', 'reply', 'comment_reply'].includes(notification.type?.toLowerCase())) {
      commentId = notification?.data?.commentId || 
                  notification?.data?.comment?.id || 
                  notification?.commentId || 
                  notification?.comment?.id || 
                  null;
    }

    return { postId, commentId };
  }, []);

  const openFromNotification = useCallback((notification) => {
    if (!notification) return;

    const { postId, commentId } = parseNotificationData(notification);

    if (postId) {
      setSelectedPostId(postId);
      setSelectedCommentId(commentId || null);
      setPostModalOpen(true);
    } else if (notification.link) {
      try {
        window.location.href = notification.link;
      } catch {}
    }

    if (notification.id) {
      markAsRead({ notificationId: notification.id });
    }
  }, [parseNotificationData, markAsRead]);

  const notificationComponents = {
    follow: FollowNotification,
    like: LikeNotification,
    comment: CommentNotification,
    tag: TagNotification,
  };

  const renderNotification = useCallback((notification) => {
    if (!isValidNotification(notification)) return null;

    const type = notification.type.toLowerCase();
    const Component = notificationComponents[type];
    if (!Component) return null;

    if (type === 'tag') {
      return <Component key={notification.id} isSeen={notification.isRead === true} />;
    }

    return <Component key={notification.id} {...getNotificationProps(notification, openFromNotification)} />;
  }, [openFromNotification]);

  const handleClosePostModal = useCallback(() => {
    setPostModalOpen(false);
    setSelectedPostId(null);
    setSelectedCommentId(null);
  }, []);

  useEffect(() => {
    const handleOpenPostModal = (event) => {
      const { postId, commentId } = event.detail || {};
      if (!postId) return;
      
      setSelectedPostId(postId);
      setSelectedCommentId(commentId || null);
      setPostModalOpen(true);
    };

    window.addEventListener('openPostModal', handleOpenPostModal);
    return () => window.removeEventListener('openPostModal', handleOpenPostModal);
  }, []);

  return (
    <div className="fixed left-20 z-50 flex justify-start border-l bg-black bg-opacity-50 dark:border-transparent">
      <div
        ref={modalRef}
        className={`h-screen max-w-lg overflow-hidden border-r border-neutral-200 bg-white text-black shadow-lg dark:border-transparent dark:bg-neutral-900 dark:text-white ${
          isNotificationOpen ? 'animate-fadeScale' : 'animate-fadeOut'
        } transition-all duration-300 ease-in-out`}
        style={{ width: modalWidth }}
      >
        <div className="border-b border-gray-200 px-5 py-4 dark:border-neutral-700">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <div className="flex items-center space-x-2">
              {isSupported && permission !== 'granted' && (
                <button
                  onClick={handleRequestDesktopNotifications}
                  className="text-xs text-neutral-800 hover:text-zinc-400 dark:text-white dark:hover:text-zinc-400"
                  title="Enable desktop notifications"
                >
                  <i className="fa-solid fa-desktop mr-1"></i>
                  Enable Desktop
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="no-scrollbar h-[calc(100%-120px)] max-h-full space-y-1 overflow-y-auto px-5 pb-5 pt-3">
          {isFetching && sortedNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400 dark:text-gray-600">Loading notifications...</div>
            </div>
          ) : sortedNotifications.length > 0 ? (
            sortedNotifications.map((notification, index) => (
              <div key={notification.id} className="space-y-2">
                {renderNotification(notification)}

                {index < sortedNotifications.length - 1 && (
                  <hr className="my-5 border-white dark:border-black" />
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <i className="fa-solid fa-bell mb-4 text-4xl text-gray-300 dark:text-gray-600"></i>
              <p className="text-center text-gray-400 dark:text-gray-600">No notifications yet</p>
              <p className="mt-2 text-center text-sm text-gray-300 dark:text-gray-700">
                When you get notifications, they&apos;ll show up here
              </p>
            </div>
          )}
        </div>
      </div>

      {postModalOpen && selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={handleClosePostModal}
          scrollToCommentId={selectedCommentId}
        />
      )}
    </div>
  );
};

export default NotificationModal;
