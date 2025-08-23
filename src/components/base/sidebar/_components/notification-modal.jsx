'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import FollowNotification from './follow-notification';
import { TagNotification } from './tag-notification';
import LikeNotification from './like-notification';
import CommentNotification from './comment-notification';
import ReportApprovedNotification from './report-approved-notification';
import AccountSuspendedNotification from './account-suspended-notification';
import AccountBannedNotification from './account-banned-notification';
import PostReportNotification from './post-report-notification';
import CommentReportNotification from './comment-report-notification';
import UserReportNotification from './user-report-notification';
import { useNotification } from '@/src/hooks/use-notification';
import { useDesktopNotifications } from '@/src/hooks/use-desktop-notifications';
import dynamic from 'next/dynamic';

const PostDetailModal = dynamic(() => import('../../post-detail-modal'), { ssr: false });

const NotificationModal = ({ isNotificationOpen, modalRef, userId }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('Notification modal error:', error);
      setHasError(true);
      setErrorMessage('Something went wrong loading notifications');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAllAsReadSilently,
    markAsRead, 
    isFetching,
    setModalOpen,
    isWebSocketConnected,
    webSocketError
  } = useNotification(userId);
  const { requestPermission, permission, isSupported } = useDesktopNotifications();
  
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  // Reset error state when modal opens
  useEffect(() => {
    if (isNotificationOpen && hasError) {
      setHasError(false);
      setErrorMessage('');
    }
  }, [isNotificationOpen, hasError]);

  useEffect(() => {
    if (isNotificationOpen) {
      if (unreadCount > 0) {
        markAllAsReadSilently();
        setModalOpen(true);
      }
    } else {
      setModalOpen(false);
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
  }, [isNotificationOpen, unreadCount, markAllAsReadSilently, markAllAsRead, setModalOpen]);

  const handleRequestDesktopNotifications = useCallback(async () => {
    const granted = await requestPermission();
    // Desktop notification permission result handled silently
  }, [requestPermission]);

  const sortedNotifications = useMemo(() => {
    try {
      if (!Array.isArray(notifications)) {
        return [];
      }
      return [...notifications].sort((a, b) => {
        try {
          const dateA = new Date(a?.timestamp || 0);
          const dateB = new Date(b?.timestamp || 0);
          return dateB - dateA;
        } catch (error) {
          return 0;
        }
      });
    } catch (error) {
      console.error('Error processing notifications:', error);
      return [];
    }
  }, [notifications]);

  const parseNotificationData = useCallback((notification) => {
    try {
      if (!notification) return {};
      
      if (notification.data && typeof notification.data === 'string') {
        return JSON.parse(notification.data);
      }
      return notification.data || {};
    } catch (error) {
      return {};
    }
  }, []);

  const openFromNotification = useCallback((notification) => {
    try {
      if (!notification) return;

      const notificationData = parseNotificationData(notification);
      const postId = notificationData.postId || notification.postId;
      const commentId = notificationData.commentId;

      if (postId) {
        const event = new CustomEvent('openPostModal', {
          detail: { postId, commentId }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error opening notification:', error);
    }
  }, [parseNotificationData]);

  const handleNotificationClick = useCallback((notification) => {
    try {
      if (!notification) return;

      markAsRead({ notificationId: notification.id });
      openFromNotification(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  }, [markAsRead, openFromNotification]);

  const isValidNotification = useCallback((notification) => {
    try {
      return notification && 
             notification.id && 
             notification.type && 
             notification.sender && 
             notification.timestamp;
    } catch (error) {
      return false;
    }
  }, []);

  const getNotificationProps = useCallback((notification, onClick) => {
    try {
      const notificationData = parseNotificationData(notification);
      
      return {
        id: notification.id,
        sender: notification.sender,
        message: notification.message,
        timestamp: notification.timestamp,
        isSeen: notification.isRead === true,
        onClick: () => onClick(notification),
        postId: notificationData.postId || notification.postId,
        commentId: notificationData.commentId,
        link: notification.link,
        data: notificationData,
      };
    } catch (error) {
      return {};
    }
  }, [parseNotificationData]);

  const notificationComponents = {
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
  };

  const renderNotification = useCallback((notification) => {
    try {
      if (!isValidNotification(notification)) return null;

      const type = notification.type?.toLowerCase();
      if (!type) {
        return null;
      }

      const Component = notificationComponents[type];
      if (!Component) {
        return null;
      }

      // Special case for TagNotification (different props)
      if (type === 'tag') {
        return <Component key={notification.id} isSeen={notification.isRead === true} />;
      }

      const props = getNotificationProps(notification, openFromNotification);
      if (!props || Object.keys(props).length === 0) {
        return null;
      }

      return <Component key={notification.id} {...props} />;
    } catch (error) {
      console.error('Error rendering notification:', error, notification);
      return null;
    }
  }, [openFromNotification, isValidNotification, getNotificationProps, notificationComponents]);

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
    <div className={`fixed left-20 z-50 flex justify-start border-l bg-black bg-opacity-50 dark:border-transparent transition-all duration-300 ease-in-out ${isNotificationOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div
        ref={modalRef}
        className={`h-screen bg-white overflow-hidden rounded-r-lg border-l border-neutral-300 dark:border-transparent dark:bg-neutral-900 transition-all duration-300 ease-in-out ${
          isNotificationOpen && 'animate-fadeScale shadow-right-left'
        } ${
          !isNotificationOpen && 'animate-fadeOut'
        }`}
        style={{ width: isNotificationOpen ? 510 : 0 }}
      >
        <div className="flex h-16 items-center justify-between border-b border-white px-5 dark:border-black">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              Notifications
            </h2>
          </div>
          {/* <button
            onClick={handleRequestDesktopNotifications}
            className="flex flex-col items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 text-white transition-all duration-200 hover:bg-blue-600 active:scale-95"
          >
            <i className="fa-solid fa-bell text-sm"></i>
            <span className="text-xs font-medium">Enable</span>
            <span className="text-xs">Push</span>
          </button> */}
        </div>

        {!isSupported && (
          <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <i className="fa-solid fa-exclamation-triangle text-xs"></i>
              Desktop notifications not supported in this browser
            </div>
          </div>
        )}

        <div className="no-scrollbar h-[calc(100%-70px)] max-h-full space-y-1 overflow-y-auto px-5 pb-5 pt-3 transition-all duration-300 ease-in-out">
          {isFetching && sortedNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                Loading notifications...
              </div>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                <i className="fa-regular fa-bell text-2xl text-gray-400"></i>
              </div>
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                No notifications yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                When you get notifications, they'll show up here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className="notification-item"
                >
                  {renderNotification(notification)}
                </div>
              ))}
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

