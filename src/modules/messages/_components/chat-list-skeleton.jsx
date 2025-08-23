import React from 'react';

const ChatListSkeleton = () => {
  return (
    <div className="px-4 py-1">
      {/* Generate 5 skeleton chat items */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="mt-3 flex w-full max-w-md cursor-pointer items-center justify-between rounded-lg p-3"
        >
          <div className="flex items-center">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-neutral-600 animate-pulse"></div>
            
            <div className="ml-4 flex-1">
              {/* Username skeleton */}
              <div className="h-4 w-24 bg-gray-300 dark:bg-neutral-600 rounded animate-pulse mb-2"></div>
              
              {/* Last message skeleton */}
              <div className="h-3 w-40 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Time skeleton */}
          <div className="h-3 w-12 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
};

export default ChatListSkeleton;
