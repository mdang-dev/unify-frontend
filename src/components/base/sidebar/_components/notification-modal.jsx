'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import FollowNotification from './follow-notification';
import { TagNotification } from './tag-notification';
import LikeNotification from './like-notification';
import CommentNotification from './comment-notification';
import { useNotification } from '@/src/hooks/use-notification';
import { useDesktopNotifications } from '@/src/hooks/use-desktop-notifications';
import NotificationQuickActions from '../../notification-quick-actions';
import dynamic from 'next/dynamic';

// ✅ Use dynamic import like share flow
const PostDetailModal = dynamic(() => import('../../post-detail-modal'), { ssr: false });

const NotificationModal = ({ isNotificationOpen, modalRef, userId }) => {
  const { notifications, unreadCount, markAllAsRead, markAsRead, isFetching } = useNotification(userId);
  const { requestPermission, permission, isSupported } = useDesktopNotifications();
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  const [modalWidth, setModalWidth] = useState(0);

  useEffect(() => {
    // userId may be temporarily undefined on hydration; ignore
  }, [userId]);

  // Also support global event trigger for opening post modal
  useEffect(() => {
    const handleOpenPostModal = (event) => {
      const { postId, commentId } = event.detail || {};
      if (!postId) return;
      setSelectedPostId(postId);
      setSelectedCommentId(commentId || null);
      setPostModalOpen(true);
    };

    window.addEventListener('openPostModal', handleOpenPostModal);
    return () => {
      window.removeEventListener('openPostModal', handleOpenPostModal);
    };
  }, []);

  useEffect(() => {
    setModalWidth(isNotificationOpen ? 471 : 0);
  }, [isNotificationOpen]);

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
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

  // ✅ Imitate share: open modal locally with parsed postId/commentId
  const openFromNotification = useCallback((notification) => {
    if (!notification) return;
    let postId = null;
    let commentId = null;

    const lowerType = notification.type?.toLowerCase?.() || '';

    // ✅ NEW: Try to parse data field first (JSON string with commentId and postId)
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        if (data.postId) postId = data.postId;
        if (data.commentId) commentId = data.commentId;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[NotificationModal] Parsed data field:', data);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[NotificationModal] Failed to parse data field:', e);
        }
      }
    }

    // Fallback: Try multiple places for postId if not found in data
    if (!postId) {
      postId =
        notification?.data?.postId ||
        notification?.data?.post?.id ||
        notification?.postId ||
        notification?.post?.id ||
        null;

      if (!postId && notification.link) {
        // Extract from link (supports absolute URLs, locale prefixes, query strings)
        try {
          const link = notification.link;
          const path = (() => {
            try {
              const u = new URL(link, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
              return u.pathname;
            } catch {
              return link; // relative path
            }
          })();
          const match = path.match(/\/posts\/([^\/?#]+)/);
          if (match) postId = match[1];
        } catch {}
      }
    }

    // Fallback: Comment id from multiple places if not found in data
    if (!commentId && (lowerType === 'comment' || lowerType === 'reply' || lowerType === 'comment_reply')) {
      commentId =
        notification?.data?.commentId ||
        notification?.data?.comment?.id ||
        notification?.commentId ||
        notification?.comment?.id ||
        null;
    }

    if (process.env.NODE_ENV === 'development') {
      // Debug log
      // eslint-disable-next-line no-console
      console.debug('[NotificationModal] parsed ids =>', { postId, commentId, raw: notification });
    }

    if (postId) {
      setSelectedPostId(postId);
      setSelectedCommentId(commentId || null);
      setPostModalOpen(true);
    } else if (notification.link) {
      // Fallback: navigate if cannot parse postId
      try {
        window.location.href = notification.link;
      } catch {}
    }

    // Mark as read optimistically
    if (notification.id) {
      try {
        markAsRead({ notificationId: notification.id });
      } catch {}
    }
  }, [markAsRead]);

  const renderNotification = (notification) => {
    if (!notification || !notification.type) {
      return null;
    }

    const commonProps = {
      isSeen: notification.isRead,
      sender: notification.sender,
      timestamp: notification.timestamp,
      onClick: () => openFromNotification(notification),
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
        style={{ width: modalWidth }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-5 py-4 dark:border-neutral-700">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <div className="flex items-center space-x-2">
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
        </div>

        {/* Content */}
        <div className="no-scrollbar h-[calc(100%-120px)] max-h-full space-y-1 overflow-y-auto px-5 pb-5 pt-3">
          {isFetching && sortedNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400 dark:text-gray-600">Loading notifications...</div>
            </div>
          ) : sortedNotifications.length > 0 ? (
            sortedNotifications.map((notification, index) => (
              <div key={notification.id} className="space-y-2">
                {renderNotification(notification)}
                <NotificationQuickActions
                  notification={notification}
                  currentUserId={userId}
                  onActionComplete={() => {}}
                />
                {index < sortedNotifications.length - 1 && (
                  <hr className="my-5 border-white dark:border-black" />
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <i className="mb-4 fa-solid fa-bell text-4xl text-gray-300 dark:text-gray-600"></i>
              <p className="text-center text-gray-400 dark:text-gray-600">No notifications yet</p>
              <p className="mt-2 text-center text-sm text-gray-300 dark:text-gray-700">
                When you get notifications, they&apos;ll show up here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {postModalOpen && selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => {
            setPostModalOpen(false);
            setSelectedPostId(null);
            setSelectedCommentId(null);
          }}
          scrollToCommentId={selectedCommentId}
        />
      )}
    </div>
  );
};

export default NotificationModal;
