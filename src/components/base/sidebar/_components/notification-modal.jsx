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
// import { useDesktopNotifications } from '@/src/hooks/use-desktop-notifications';
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
  // const { requestPermission, permission, isSupported } = useDesktopNotifications();
  
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

  // ✅ FIX: Reset post modal state when notification modal closes
  useEffect(() => {
    if (!isNotificationOpen) {
      setPostModalOpen(false);
      setSelectedPostId(null);
      setSelectedCommentId(null);
    }
  }, [isNotificationOpen]);

  // ✅ FIX: Reset post modal state when notification modal is reopened
  useEffect(() => {
    if (isNotificationOpen) {
      // Reset any stale post modal state when notification modal opens
      setPostModalOpen(false);
      setSelectedPostId(null);
      setSelectedCommentId(null);
    }
  }, [isNotificationOpen]);

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

  // const handleRequestDesktopNotifications = useCallback(async () => {
  //   const granted = await requestPermission();
  //   // Desktop notification permission result handled silently
  // }, [requestPermission]);

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
      
      // ✅ DEBUG: Log raw notification data
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationModal] Parsing notification data:', {
          rawData: notification.data,
          type: typeof notification.data,
          hasData: !!notification.data,
          notificationType: notification.type,
          link: notification.link,
          postId: notification.postId
        });
      }
      
      if (notification.data && typeof notification.data === 'string') {
        const parsed = JSON.parse(notification.data);
        if (process.env.NODE_ENV === 'development') {
          console.log('[NotificationModal] Parsed JSON data:', parsed);
        }
        return parsed;
      }
      return notification.data || {};
    } catch (error) {
      console.error('Error parsing notification data:', error);
      return {};
    }
  }, []);

  const openFromNotification = useCallback((notification) => {
    try {
      if (!notification) return;

      const notificationData = parseNotificationData(notification);
      let postId = notificationData.postId || notification.postId;
      let commentId = notificationData.commentId;

      // ✅ FIX: Handle post_report notifications - extract entityId as postId
      if (notification.type === 'post_report' && notificationData.entityId) {
        postId = notificationData.entityId;
        if (process.env.NODE_ENV === 'development') {
          console.log('[NotificationModal] Extracted postId from post_report entityId:', postId);
        }
      }

      // ✅ FIX: Handle comment_report notifications - extract entityId as commentId and postId from link
      if (notification.type === 'comment_report' && notificationData.entityId) {
        commentId = notificationData.entityId;
        // For comment reports, we need to extract the postId from the link
        if (notification.link) {
          const linkMatch = notification.link.match(/\/posts\/([^\/]+)/);
          if (linkMatch) {
            postId = linkMatch[1];
            if (process.env.NODE_ENV === 'development') {
              console.log('[NotificationModal] Extracted postId from comment_report link:', postId);
              console.log('[NotificationModal] Extracted commentId from comment_report entityId:', commentId);
            }
          }
        }
      }

      // ✅ FIX: Extract postId from link field for like notifications if not found in data
      if (!postId && notification.link) {
        const linkMatch = notification.link.match(/\/posts\/([^\/]+)/);
        if (linkMatch) {
          postId = linkMatch[1];
          if (process.env.NODE_ENV === 'development') {
            console.log('[NotificationModal] Extracted postId from link:', postId);
          }
        }
      }

      // ✅ FIX: Additional fallback - try to extract from message or other fields
      if (!postId && notification.message) {
        const messageMatch = notification.message.match(/\/posts\/([^\/]+)/);
        if (messageMatch) {
          postId = messageMatch[1];
          if (process.env.NODE_ENV === 'development') {
            console.log('[NotificationModal] Extracted postId from message:', postId);
          }
        }
      }

      // ✅ DEBUG: Log notification data for troubleshooting
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationModal] Opening notification:', {
          notification,
          notificationData,
          postId,
          commentId,
          type: notification.type,
          link: notification.link,
          message: notification.message
        });
      }

      if (postId) {
        // ✅ FIX: Set state directly instead of using custom event
        setSelectedPostId(postId);
        setSelectedCommentId(commentId || null);
        setPostModalOpen(true);
      } else {
        console.warn('[NotificationModal] No postId found in notification:', notification);
        // ✅ DEBUG: Log all available fields for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[NotificationModal] Available notification fields:', {
            id: notification.id,
            type: notification.type,
            data: notification.data,
            link: notification.link,
            message: notification.message,
            postId: notification.postId
          });
        }
      }
    } catch (error) {
      console.error('Error opening notification:', error);
    }
  }, [parseNotificationData]);

  const handleNotificationClick = useCallback((notification) => {
    try {
      if (!notification) return;

      // ✅ DEBUG: Log notification click
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationModal] Notification clicked:', {
          id: notification.id,
          type: notification.type,
          data: notification.data
        });
      }

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
      let postId = notificationData.postId || notification.postId;
      let commentId = notificationData.commentId;
      
      // ✅ FIX: Handle post_report notifications - extract entityId as postId
      if (notification.type === 'post_report' && notificationData.entityId) {
        postId = notificationData.entityId;
      }

      // ✅ FIX: Handle comment_report notifications - extract entityId as commentId and postId from link
      if (notification.type === 'comment_report' && notificationData.entityId) {
        commentId = notificationData.entityId;
        // For comment reports, we need to extract the postId from the link
        if (notification.link) {
          const linkMatch = notification.link.match(/\/posts\/([^\/]+)/);
          if (linkMatch) {
            postId = linkMatch[1];
          }
        }
      }
      
      // ✅ FIX: Extract postId from link field if not found in data (for like notifications)
      if (!postId && notification.link) {
        const linkMatch = notification.link.match(/\/posts\/([^\/]+)/);
        if (linkMatch) {
          postId = linkMatch[1];
        }
      }
      
      return {
        id: notification.id,
        sender: notification.sender,
        message: notification.message,
        timestamp: notification.timestamp,
        isSeen: notification.isRead === true,
        onClick: () => onClick(notification), // ✅ FIX: Ensure onClick is properly bound
        postId: postId,
        commentId: commentId,
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

      // ✅ DEBUG: Log like notification data specifically
      if (type === 'like' && process.env.NODE_ENV === 'development') {
        console.log('[NotificationModal] Rendering like notification:', {
          id: notification.id,
          data: notification.data,
          link: notification.link,
          postId: notification.postId
        });
      }

      const Component = notificationComponents[type];
      if (!Component) {
        return null;
      }

      // Special case for TagNotification (different props)
      if (type === 'tag') {
        return <Component key={notification.id} isSeen={notification.isRead === true} />;
      }

      const props = getNotificationProps(notification, handleNotificationClick); // ✅ FIX: Use handleNotificationClick to mark as read
      if (!props || Object.keys(props).length === 0) {
        return null;
      }

      // ✅ DEBUG: Log final props for like notifications
      if (type === 'like' && process.env.NODE_ENV === 'development') {
        console.log('[NotificationModal] Like notification props:', props);
      }

      return <Component key={notification.id} {...props} />;
    } catch (error) {
      console.error('Error rendering notification:', error, notification);
      return null;
    }
  }, [handleNotificationClick, isValidNotification, getNotificationProps, notificationComponents]);

  const handleClosePostModal = useCallback(() => {
    // ✅ FIX: Only close post modal, keep notification modal open
    setPostModalOpen(false);
    setSelectedPostId(null);
    setSelectedCommentId(null);
  }, []);

  // ✅ REMOVE: No longer need custom event listener since we handle state directly
  // useEffect(() => {
  //   const handleOpenPostModal = (event) => {
  //     const { postId, commentId } = event.detail || {};
  //     if (!postId) return;
  //     
  //     setSelectedPostId(postId);
  //     setSelectedCommentId(commentId || null);
  //     setPostModalOpen(true);
  //   };

  //   window.addEventListener('openPostModal', handleOpenPostModal);
  //   return () => window.removeEventListener('openPostModal', handleOpenPostModal);
  // }, []);

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
            <h2 className="text-3xl font-semibold text-black dark:text-white ml-4 mt-5">
              Notifications
            </h2>
          {/* <button
            onClick={handleRequestDesktopNotifications}
            className="flex flex-col items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 text-white transition-all duration-200 hover:bg-blue-600 active:scale-95"
          >
            <i className="fa-solid fa-bell text-sm"></i>
            <span className="text-xs font-medium">Enable</span>
            <span className="text-xs">Push</span>
          </button> */}
        </div>

        {/* {!isSupported && (
          <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <i className="fa-solid fa-exclamation-triangle text-xs"></i>
              Desktop notifications not supported in this browser
            </div>
          </div>
        )} */}

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
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Rendering {sortedNotifications.length} notifications
                </div>
              )}
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
          key={`${selectedPostId}-${selectedCommentId || 'no-comment'}`} // ✅ FIX: Add key to force re-render when post/comment changes
          postId={selectedPostId}
          onClose={handleClosePostModal}
          scrollToCommentId={selectedCommentId}
        />
      )}
    </div>
  );
};

export default NotificationModal;

