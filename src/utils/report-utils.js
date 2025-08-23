/**
 * Utility functions and constants for report management
 * Centralizes report-related logic for consistency across the application
 */

// Report threshold constants
export const REPORT_THRESHOLDS = {
  SUSPENSION: 3,
  PERMANENT_BAN: 5
};

// Report status types
export const REPORT_STATUS = {
  GOOD_STANDING: 'good_standing',
  UNDER_REVIEW: 'under_review',
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

// Status configuration for UI display
export const STATUS_CONFIG = {
  [REPORT_STATUS.BANNED]: {
    label: 'Permanently Banned',
    color: 'danger',
    description: 'Account banned due to multiple violations',
    icon: 'fa-solid fa-ban',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200'
  },
  [REPORT_STATUS.SUSPENDED]: {
    label: 'Temporarily Suspended',
    color: 'warning',
    description: 'Account suspended due to multiple violations',
    icon: 'fa-solid fa-clock',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200'
  },
  [REPORT_STATUS.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'default',
    description: 'Account has approved reports',
    icon: 'fa-solid fa-eye',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  [REPORT_STATUS.GOOD_STANDING]: {
    label: 'Good Standing',
    color: 'success',
    description: 'No approved reports',
    icon: 'fa-solid fa-check-circle',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200'
  }
};

/**
 * Get report status based on report count
 * @param {number} reportCount - Number of approved reports
 * @returns {string} Report status
 */
export const getReportStatus = (reportCount) => {
  if (reportCount >= REPORT_THRESHOLDS.PERMANENT_BAN) {
    return REPORT_STATUS.BANNED;
  }
  if (reportCount >= REPORT_THRESHOLDS.SUSPENSION) {
    return REPORT_STATUS.SUSPENDED;
  }
  if (reportCount > 0) {
    return REPORT_STATUS.UNDER_REVIEW;
  }
  return REPORT_STATUS.GOOD_STANDING;
};

/**
 * Check if user should be automatically logged out
 * @param {number} reportCount - Number of approved reports
 * @returns {boolean} True if logout should occur
 */
export const shouldAutoLogout = (reportCount) => {
  return reportCount >= REPORT_THRESHOLDS.SUSPENSION;
};

/**
 * Get appropriate logout message based on report count
 * @param {number} reportCount - Number of approved reports
 * @returns {string} Logout message
 */
export const getLogoutMessage = (reportCount) => {
  if (reportCount >= REPORT_THRESHOLDS.PERMANENT_BAN) {
    return 'Your account has been permanently banned due to multiple violations.';
  }
  if (reportCount >= REPORT_THRESHOLDS.SUSPENSION) {
    return 'Your account has been suspended due to multiple violations.';
  }
  return '';
};

/**
 * Get warning message for users with reports
 * @param {number} reportCount - Number of approved reports
 * @returns {string} Warning message
 */
export const getWarningMessage = (reportCount) => {
  if (reportCount >= REPORT_THRESHOLDS.SUSPENSION) {
    return `You have ${reportCount} approved report(s). Your account may be suspended or banned with more reports.`;
  }
  if (reportCount > 0) {
    return `You have ${reportCount} approved report(s). Please review your content and community guidelines.`;
  }
  return '';
};

/**
 * Get status configuration for UI display
 * @param {string} status - Report status
 * @returns {Object} Status configuration object
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG[REPORT_STATUS.GOOD_STANDING];
};

/**
 * Format report count for display
 * @param {number} reportCount - Number of approved reports
 * @returns {string} Formatted report count
 */
export const formatReportCount = (reportCount) => {
  if (reportCount === 0) return 'No reports';
  if (reportCount === 1) return '1 report';
  return `${reportCount} reports`;
};
