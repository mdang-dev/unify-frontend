'use client';

import { useEffect } from 'react';
import { useReportCount } from './use-report-count';
import { useAuthStore } from '../stores/auth.store';
import { REPORT_STATUS } from '../utils/report-utils';

/**
 * Hook for additional report monitoring and logging
 * This is a lightweight wrapper around useReportCount for additional monitoring purposes
 */
export const useReportMonitoring = () => {
  const { user } = useAuthStore();
  const { currentReportCount, getReportStatus } = useReportCount();

  // Monitor report count changes for logging and monitoring purposes
  useEffect(() => {
    if (!user) return;

    const reportCount = user.reportApprovalCount || 0;
    const status = getReportStatus(reportCount);
    
    // Log status changes for monitoring purposes
    switch (status) {
      case REPORT_STATUS.BANNED:
        console.error(`User ${user.username} has ${reportCount} approved reports - PERMANENT BAN`);
        break;
      case REPORT_STATUS.SUSPENDED:
        console.warn(`User ${user.username} has ${reportCount} approved reports - TEMPORARY SUSPENSION`);
        break;
      case REPORT_STATUS.UNDER_REVIEW:
        console.info(`User ${user.username} has ${reportCount} approved reports - UNDER REVIEW`);
        break;
      default:
        // Good standing - no logging needed
        break;
    }
  }, [user?.reportApprovalCount, user?.username, getReportStatus]);

  return {
    currentReportCount,
    isMonitoring: !!user,
    reportStatus: user ? getReportStatus(user.reportApprovalCount || 0) : null,
  };
};

