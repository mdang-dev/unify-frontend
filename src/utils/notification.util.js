export const getNotificationProps = (notification, onClick) => ({
  isSeen: notification.isRead === true,
  sender: notification.sender,
  timestamp: notification.timestamp,
  onClick: () => onClick?.(notification),
});

export const isValidNotification = (notification) => {
  return notification && 
         notification.id && 
         notification.type && 
         notification.sender && 
         notification.timestamp;
};

export const getNotificationDisplayName = (type) => {
  const names = {
    follow: 'Follow',
    like: 'Like',
    comment: 'Comment',
    tag: 'Tag',
    reply: 'Reply',
    mention: 'Mention',
    share: 'Share',
    post: 'Post',
    story: 'Story',
    reel: 'Reel',
    live: 'Live',
    event: 'Event',
    group: 'Group',
    message: 'Message',
    call: 'Call',
    video: 'Video',
    audio: 'Audio',
    file: 'File',
    link: 'Link',
    other: 'Other'
  };
  
  return names[type?.toLowerCase()] || 'Notification';
};

export const isUnreadNotification = (notification) => {
  return notification?.isRead === false;
};

export const getNotificationPriority = (notification) => {
  const priorities = {
    follow: 1,
    like: 2,
    comment: 3,
    tag: 4,
    reply: 5,
    mention: 6,
    share: 7,
    post: 8,
    story: 9,
    reel: 10,
    live: 11,
    event: 12,
    group: 13,
    message: 14,
    call: 15,
    video: 16,
    audio: 17,
    file: 18,
    link: 19,
    other: 20
  };
  
  return priorities[notification?.type?.toLowerCase()] || 20;
};

export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInMs = now - notificationTime;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return notificationTime.toLocaleDateString();
};
