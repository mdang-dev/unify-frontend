/**
 * Notification Factory - Handles different notification types and provides
 * appropriate messages, actions, and rendering logic
 */

/**
 * Get notification message based on type and data
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {string} Localized message
 */
export const getNotificationMessage = (type, data = {}) => {
  const baseType = type.toLowerCase();
  
  // Handle report-specific notifications
  if (baseType.includes('report')) {
    return getReportNotificationMessage(baseType, data);
  }
  
  // Handle account action notifications
  if (baseType.includes('account')) {
    return getAccountActionMessage(baseType, data);
  }
  
  // Default messages for other types
  return getDefaultNotificationMessage(baseType, data);
};

/**
 * Get report-specific notification message
 * @param {string} type - Report type
 * @param {Object} data - Report data
 * @returns {string} Report message
 */
const getReportNotificationMessage = (type, data) => {
  const reportType = data.reportType || 'general';
  
  const messages = {
    'post_report': 'Your post has just been reported.',
    'comment_report': 'Your comment has just been reported.',
    'user_report': 'Your profile has just been reported.',
    'story_report': 'Your story has just been reported.',
    'reel_report': 'Your reel has just been reported.',
    'message_report': 'Your message has just been reported.',
    'report_approved': 'A report against your account has been approved.',
    'general': 'Your content has just been reported.'
  };
  
  return messages[type] || messages[reportType] || messages.general;
};

/**
 * Get account action notification message
 * @param {string} type - Account action type
 * @param {Object} data - Action data
 * @returns {string} Account action message
 */
const getAccountActionMessage = (type, data) => {
  const reportCount = data.reportCount || 0;
  
  if (type === 'account_suspended') {
    return `Your account has been temporarily suspended due to ${reportCount} approved reports.`;
  }
  
  if (type === 'account_banned') {
    return `Your account has been permanently banned due to ${reportCount} approved reports.`;
  }
  
  return 'Your account status has been updated.';
};

/**
 * Get default notification message
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {string} Default message
 */
const getDefaultNotificationMessage = (type, data) => {
  const senderName = data.sender?.fullName || 'Someone';
  
  const messages = {
    'follow': `${senderName} is following you.`,
    'like': `${senderName} liked your post.`,
    'comment': `${senderName} commented on your post.`,
    'tag': `${senderName} tagged you in a post.`,
    'share': `${senderName} shared your post.`,
    'message': `${senderName} sent you a message.`,
    'system': 'You have a new system notification.'
  };
  
  return messages[type] || 'You have a new notification.';
};

/**
 * Get notification action based on type and data
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Action configuration
 */
export const getNotificationAction = (type, data = {}) => {
  const baseType = type.toLowerCase();
  
  if (baseType.includes('report')) {
    return getReportNotificationAction(baseType, data);
  }
  
  if (baseType.includes('account')) {
    return getAccountActionAction(baseType, data);
  }
  
  return getDefaultNotificationAction(baseType, data);
};

/**
 * Get report notification action
 * @param {string} type - Report type
 * @param {Object} data - Report data
 * @returns {Object} Action configuration
 */
const getReportNotificationAction = (type, data) => {
  const entityId = data.entityId;
  const entityType = data.reportType;
  
  if (!entityId) {
    return {
      label: 'View Details',
      onClick: () => window.location.href = '/settings'
    };
  }
  
  // Generate appropriate link based on entity type
  const link = generateEntityLink(entityType, entityId);
  
  return {
    label: 'View Content',
    onClick: () => window.location.href = link
  };
};

/**
 * Get account action notification action
 * @param {string} type - Account action type
 * @param {Object} data - Action data
 * @returns {Object} Action configuration
 */
const getAccountActionAction = (type, data) => {
  if (type === 'account_suspended' || type === 'account_banned') {
    return {
      label: 'Learn More',
      onClick: () => window.location.href = '/help/account-status'
    };
  }
  
  return {
    label: 'View Details',
    onClick: () => window.location.href = '/settings'
  };
};

/**
 * Get default notification action
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Action configuration
 */
const getDefaultNotificationAction = (type, data) => {
  if (type === 'post' && data.postId) {
    return {
      label: 'View Post',
      onClick: () => window.location.href = `/posts/${data.postId}`
    };
  }
  
  if (type === 'comment' && data.commentId) {
    return {
      label: 'View Comment',
      onClick: () => window.location.href = `/posts/${data.postId}#comment-${data.commentId}`
    };
  }
  
  return null;
};

/**
 * Generate entity link based on type and ID
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @returns {string} Generated link
 */
const generateEntityLink = (entityType, entityId) => {
  if (!entityType || !entityId) return '/settings';
  
  const links = {
    'post': `/posts/${entityId}`,
    'comment': `/posts/${entityId}#comment-${entityId}`,
    'user': `/profile/${entityId}`,
    'story': `/stories/${entityId}`,
    'reel': `/reels/${entityId}`,
    'message': `/messages/${entityId}`
  };
  
  return links[entityType] || '/settings';
};

/**
 * Check if notification is a report type
 * @param {string} type - Notification type
 * @returns {boolean} True if it's a report notification
 */
export const isReportNotification = (type) => {
  if (!type) return false;
  
  const reportTypes = [
    'post_report', 'comment_report', 'user_report', 'story_report',
    'reel_report', 'message_report', 'report_approved',
    'account_suspended', 'account_banned'
  ];
  
  return reportTypes.includes(type.toLowerCase());
};

/**
 * Get notification priority level
 * @param {string} type - Notification type
 * @returns {string} Priority level (high, medium, low)
 */
export const getNotificationPriority = (type) => {
  if (!type) return 'low';
  
  const highPriority = ['account_banned', 'account_suspended', 'report_approved'];
  const mediumPriority = ['post_report', 'comment_report', 'user_report'];
  
  if (highPriority.includes(type.toLowerCase())) return 'high';
  if (mediumPriority.includes(type.toLowerCase())) return 'medium';
  
  return 'low';
};



