'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/avt-exp.jpg';
import { formatDistanceToNow } from 'date-fns';

const PostReportNotification = React.memo(function PostReportNotification({ isSeen, sender, timestamp, onClick, data }) {
  if (!sender || !sender.fullName) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const timeAgo = useMemo(() => {
    const time = formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      includeSeconds: true,
    });
    return time.replace('about ', '');
  }, [timestamp]);

  // Parse notification data to get entity information
  const entityInfo = useMemo(() => {
    if (!data) return { entityId: null, adminId: null, adminReason: null };
    
    try {
      let parsedData;
      
      // Handle both cases: data is already an object or a JSON string
      if (typeof data === 'object') {
        parsedData = data;
      } else if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      } else {
        return { entityId: null, adminId: null, adminReason: null };
      }
      
      return {
        entityId: parsedData.entityId,
        adminId: parsedData.adminId,
        adminReason: parsedData.adminReason
      };
    } catch (error) {
      console.error('Post Report Notification - parsing error:', error);
      return { entityId: null, adminId: null, adminReason: null };
    }
  }, [data]);

  return (
    <div
      onClick={onClick}
      className={`max-h-[125px] w-full cursor-pointer items-center rounded-xl p-2 px-4 transition-colors duration-200 ${
        isSeen 
          ? 'hover:bg-gray-100 dark:hover:bg-neutral-800' 
          : 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Use Unify icon for admin notifications instead of avatar */}
          <div className="w-[50px] h-[50px] rounded-full border border-gray-300 dark:border-neutral-700 flex items-center justify-center bg-white dark:bg-neutral-800">
            <Image
              src={entityInfo.adminId === 'SYSTEM' ? '/images/unify_icon.png' : (sender?.avatar || Avatar)}
              alt={entityInfo.adminId === 'SYSTEM' ? 'Unify Admin' : 'User Avatar'}
              width={entityInfo.adminId === 'SYSTEM' ? 50 : 50}
              height={entityInfo.adminId === 'SYSTEM' ? 50 : 50}
              className={`${entityInfo.adminId === 'SYSTEM' ? 'dark:hidden' : 'hidden'} object-cover rounded-full`}
            />
            <Image
              src={entityInfo.adminId === 'SYSTEM' ? '/images/unify_icon_2.png' : (sender?.avatar || Avatar)}
              alt={entityInfo.adminId === 'SYSTEM' ? 'Unify Admin' : 'User Avatar'}
              width={entityInfo.adminId === 'SYSTEM' ? 50 : 50}
              height={entityInfo.adminId === 'SYSTEM' ? 50 : 50}
              className={`${entityInfo.adminId === 'SYSTEM' ? 'hidden dark:block' : 'hidden'} object-cover rounded-full`}
            />
          </div>
        </div>

        <div className="flex flex-grow flex-col">
          <div className="flex items-center justify-between gap-2">
            <p className="text-md dark:text-zinc-300">
              <strong className="text-sm font-extrabold dark:text-zinc-200">
                {sender.fullName}
              </strong>{' '}
              <span className="text-black dark:text-zinc-300 font-medium">
                Your post has just been reported.
              </span>{' '}
            </p>
          </div>
          
          {/* Additional information */}
          <div className="mt-1">
            {entityInfo.adminReason ? (
              <>
                <p className="text-sm font-medium text-black dark:text-zinc-300">
                  ⚠️ Admin Reason: {entityInfo.adminReason}
                </p>
                <small className="text-zinc-500 dark:text-neutral-500">{timeAgo}</small>
              </>
            ) : (
              <p className="text-sm font-medium text-black dark:text-zinc-300">
                ⚠️ Heed! Repeated violations can result in account lockouts.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PostReportNotification;



