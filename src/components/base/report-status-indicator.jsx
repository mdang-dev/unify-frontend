'use client';

import React from 'react';
import { useReportCount } from '../../hooks/use-report-count';
import { useAuthStore } from '../../stores/auth.store';
import { Chip } from '@heroui/react';
import { getStatusConfig, formatReportCount } from '../../utils/report-utils';

/**
 * Component to display user's report status and warnings
 * Shows current report count and appropriate status information
 */
export const ReportStatusIndicator = () => {
  const { user } = useAuthStore();
  const { currentReportCount, isWebSocketConnected, getReportStatus } = useReportCount();

  if (!user) return null;

  const reportCount = user.reportApprovalCount || 0;
  const status = getReportStatus(reportCount);
  const statusInfo = getStatusConfig(status);
  
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Header with status and connection indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`${statusInfo.icon} text-lg`}></i>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Report Status
          </h3>
        </div>
        
        {/* WebSocket connection indicator */}
        <div className="flex items-center gap-2">
          <Chip
            color={statusInfo.color}
            variant="flat"
            size="sm"
          >
            {statusInfo.label}
          </Chip>
          
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isWebSocketConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Status description */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {statusInfo.description}
      </div>
      
      {/* Report count display */}
      {reportCount > 0 && (
        <div className="text-sm">
          <span className="font-medium">Current Reports:</span> {formatReportCount(reportCount)}
        </div>
      )}
      
      {/* Warning messages for users with reports */}
      {reportCount > 0 && (
        <div className={`mt-3 p-3 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-md`}>
          <div className="flex items-start gap-2">
            <i className={`${statusInfo.icon} ${statusInfo.textColor} mt-0.5`}></i>
            <div className={`text-xs ${statusInfo.textColor}`}>
              <p className="font-medium mb-1">Important Notice:</p>
              <ul className="space-y-1">
                {reportCount >= 3 && (
                  <li>• Your account may be suspended or banned with more reports</li>
                )}
                {reportCount >= 1 && (
                  <li>• Please review your content and community guidelines</li>
                )}
                <li>• Contact support if you believe reports were made in error</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

