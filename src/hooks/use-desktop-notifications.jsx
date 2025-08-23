'use client';

import { useState, useEffect, useCallback } from 'react';

export const useDesktopNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check if browser supports notifications
  useEffect(() => {
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Show desktop notification
  const showNotification = useCallback(({ title, body, icon, tag, data, onClick }) => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: tag || 'unify-notification',
        data,
        requireInteraction: false,
        silent: false,
      });

      // Handle notification click
      if (onClick) {
        notification.onclick = (event) => {
          event.preventDefault();
          onClick(notification, event);
          
          // Focus the window if it's not focused
          if (window.focus) {
            window.focus();
          }
          
          notification.close();
        };
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  // Show notification for different types
  const showFollowNotification = useCallback((senderName) => {
    return showNotification({
      title: 'New Follower',
      body: `${senderName} started following you`,
      icon: '/images/avatar.png',
      tag: 'follow-notification',
      onClick: () => {
        // Navigate to notifications or profile
        if (typeof window !== 'undefined') {
          window.location.href = '/notifications';
        }
      },
    });
  }, [showNotification]);

  const showLikeNotification = useCallback((senderName, postTitle) => {
    return showNotification({
      title: 'New Like',
      body: `${senderName} liked your post${postTitle ? `: ${postTitle}` : ''}`,
      icon: '/images/heart-icon.png',
      tag: 'like-notification',
      onClick: () => {
        // Navigate to notifications
        if (typeof window !== 'undefined') {
          window.location.href = '/notifications';
        }
      },
    });
  }, [showNotification]);

  const showCommentNotification = useCallback((senderName, postTitle) => {
    return showNotification({
      title: 'New Comment',
      body: `${senderName} commented on your post${postTitle ? `: ${postTitle}` : ''}`,
      icon: '/images/comment-icon.png',
      tag: 'comment-notification',
      onClick: () => {
        // Navigate to notifications
        if (typeof window !== 'undefined') {
          window.location.href = '/notifications';
        }
      },
    });
  }, [showNotification]);

  const showTagNotification = useCallback((senderName, postTitle) => {
    return showNotification({
      title: 'You were tagged',
      body: `${senderName} tagged you in a post${postTitle ? `: ${postTitle}` : ''}`,
      icon: '/images/tag-icon.png',
      tag: 'tag-notification',
      onClick: () => {
        // Navigate to notifications
        if (typeof window !== 'undefined') {
          window.location.href = '/notifications';
        }
      },
    });
  }, [showNotification]);

  // Check if notifications are enabled in user settings
  const isNotificationsEnabled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    try {
      const settings = localStorage.getItem('notificationSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.pushNotifications !== false; // Default to true
      }
      return true; // Default to enabled
    } catch (error) {
      console.warn('Failed to parse notification settings:', error);
      return true;
    }
  }, []);

  // Show notification based on type
  const showNotificationByType = useCallback((notification) => {
    if (!isNotificationsEnabled()) {
      return null;
    }

    const senderName = notification.sender?.name || notification.sender?.username || 'Someone';
    const postTitle = notification.message || '';

    switch (notification.type?.toLowerCase()) {
      case 'follow':
        return showFollowNotification(senderName);
      case 'like':
        return showLikeNotification(senderName, postTitle);
      case 'comment':
        return showCommentNotification(senderName, postTitle);
      case 'tag':
        return showTagNotification(senderName, postTitle);
      default:
        return showNotification({
          title: 'New Notification',
          body: notification.message || 'You have a new notification',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/notifications';
            }
          },
        });
    }
  }, [isNotificationsEnabled, showFollowNotification, showLikeNotification, showCommentNotification, showTagNotification, showNotification]);

  return {
    // State
    permission,
    isSupported,
    
    // Actions
    requestPermission,
    showNotification,
    showNotificationByType,
    
    // Convenience methods
    showFollowNotification,
    showLikeNotification,
    showCommentNotification,
    showTagNotification,
    
    // Utilities
    isNotificationsEnabled,
  };
}; 