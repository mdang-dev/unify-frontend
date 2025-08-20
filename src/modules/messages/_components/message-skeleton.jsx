import React from 'react';

const MessageSkeleton = () => {
  return (
    <div className="m-4 mb-0 flex flex-col gap-3">
      {/* Generate 5 skeleton message items */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex justify-start">
          <div className="mr-3">
            {/* Avatar skeleton */}
            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-neutral-600 animate-pulse"></div>
          </div>
          
          <div className="flex max-w-[75%] flex-col items-start">
            {/* Message content skeleton */}
            <div className="mb-3">
              <div className="h-16 w-48 rounded-2xl bg-gray-300 dark:bg-neutral-600 animate-pulse"></div>
            </div>
            
            {/* Time skeleton */}
            <div className="h-3 w-16 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
      
      {/* Add some variation for different message types */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`var-${index}`} className="flex justify-end">
          <div className="flex max-w-[75%] flex-col items-end">
            {/* Right-aligned message skeleton */}
            <div className="mb-3">
              <div className={`h-12 w-32 rounded-2xl bg-blue-300 dark:bg-blue-600 animate-pulse`}></div>
            </div>
            
            {/* Time skeleton */}
            <div className="h-3 w-16 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
