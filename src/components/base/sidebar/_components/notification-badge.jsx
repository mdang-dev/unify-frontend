'use client';

import React from 'react';

const NotificationBadge = ({ count = 0, className = '' }) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <div
      className={`absolute top-7 right-5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center ${className}`}
      title={`${count} unread notification${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </div>
  );
};

export default NotificationBadge; 