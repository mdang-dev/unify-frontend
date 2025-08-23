'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/avt-exp.jpg';
import { formatDistanceToNow } from 'date-fns';

const ReportApprovedNotification = React.memo(function ReportApprovedNotification({ isSeen, sender, timestamp, onClick, data }) {
  if (!sender || !sender.fullName) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const timeAgo = useMemo(() => {
    const time = formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      includeSeconds: true,
    });
    return time.replace('about ', '');
  }, [timestamp]);

  // Parse notification data to determine report type
  const reportInfo = useMemo(() => {
    if (!data) return { type: 'general', message: 'approved a report against your account.', adminReason: null };
    
    try {
      let parsedData;
      
      // Handle both cases: data is already an object or a JSON string
      if (typeof data === 'object') {
        parsedData = data;
      } else if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      } else {
        return { type: 'general', message: 'approved a report against your account.', adminReason: null };
      }
      
      const reportType = parsedData.reportType || 'general';
      
      const typeMessages = {
        'post': 'Your post has just been reported and approved.',
        'comment': 'Your comment has just been reported and approved.',
        'user': 'Your profile has just been reported and approved.',
        'story': 'Your story has just been reported and approved.',
        'reel': 'Your reel has just been reported and approved.',
        'message': 'Your message has just been reported and approved.',
        'general': 'approved a report against your account.'
      };
      
      return {
        type: reportType,
        message: typeMessages[reportType] || typeMessages.general,
        adminReason: parsedData.adminReason
      };
    } catch (error) {
      console.error('Report Approved Notification - parsing error:', error);
      return { type: 'general', message: 'approved a report against your account.', adminReason: null };
    }
  }, [data]);

  return (
    <div
      onClick={onClick}
      className={`max-h-[88px] cursor-pointer items-center rounded-xl p-2 px-4 transition-colors duration-200 ${
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
              src={reportInfo.adminReason ? '/images/unify_icon.png' : (sender?.avatar || Avatar)}
              alt={reportInfo.adminReason ? 'Unify Admin' : 'User Avatar'}
              width={reportInfo.adminReason ? 50 : 50}
              height={reportInfo.adminReason ? 50 : 50}
              className={`${reportInfo.adminReason ? 'dark:hidden' : 'hidden'} object-cover rounded-full`}
            />
            <Image
              src={reportInfo.adminReason ? '/images/unify_icon_2.png' : (sender?.avatar || Avatar)}
              alt={reportInfo.adminReason ? 'Unify Admin' : 'User Avatar'}
              width={reportInfo.adminReason ? 50 : 50}
              height={reportInfo.adminReason ? 50 : 50}
              className={`${reportInfo.adminReason ? 'hidden dark:block' : 'hidden'} object-cover rounded-full`}
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
                {reportInfo.message}
              </span>{' '}
            </p>
          </div>
          
          {/* Additional warning message */}
          <div className="mt-1">
            {reportInfo.adminReason ? (
              <>
                <p className="text-sm font-medium text-black dark:text-zinc-300">
                  ⚠️ Admin Reason: {reportInfo.adminReason}
                </p>
                <small className="text-zinc-500 dark:text-neutral-500">{timeAgo}</small>
              </>
            ) : (
              <p className="text-sm font-medium text-black dark:text-zinc-300">
                ⚠️ Careful! Your account may be locked if you repeat the offense repeatedly.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReportApprovedNotification;
