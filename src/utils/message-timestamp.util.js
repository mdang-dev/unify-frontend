/**
 * Utility functions for managing message timestamps
 * Ensures consistent Vietnam timezone usage for chat messages
 */

import { getVietnamTimeISO } from './timezone.util';

/**
 * Tạo timestamp tạm thời cho optimistic UI
 * Chỉ sử dụng cho hiển thị UI, server sẽ tạo timestamp chính thức
 * @returns {string} ISO string cho UI tạm thời
 */
export const createTemporaryTimestamp = () => {
  return getVietnamTimeISO();
};

/**
 * So sánh hai timestamp để kiểm tra xem có gần nhau không (trong vòng 10 giây)
 * Dùng để detect duplicate messages
 * @param {string|Date} timestamp1 - Timestamp đầu tiên
 * @param {string|Date} timestamp2 - Timestamp thứ hai
 * @returns {boolean} True nếu hai timestamp gần nhau
 */
export const areTimestampsClose = (timestamp1, timestamp2, toleranceMs = 10000) => {
  if (!timestamp1 || !timestamp2) return false;
  
  try {
    const time1 = new Date(timestamp1).getTime();
    const time2 = new Date(timestamp2).getTime();
    return Math.abs(time1 - time2) < toleranceMs;
  } catch (error) {
    return false;
  }
};

/**
 * Tạo message payload để gửi lên server
 * Server sẽ tự tạo timestamp với timezone Việt Nam
 * @param {Object} message - Message object
 * @returns {Object} Message payload với timestamp = null
 */
export const createServerBoundMessage = (message) => {
  return {
    ...message,
    timestamp: null // Server sẽ tạo timestamp với timezone Việt Nam
  };
};

/**
 * Merge server response với optimistic message
 * Ưu tiên sử dụng timestamp từ server
 * @param {Object} optimisticMessage - Message tạm thời từ UI
 * @param {Object} serverMessage - Message từ server
 * @returns {Object} Message đã merge với timestamp từ server
 */
export const mergeWithServerMessage = (optimisticMessage, serverMessage) => {
  return {
    ...optimisticMessage,
    ...serverMessage,
    id: serverMessage?.id || optimisticMessage.id,
    timestamp: serverMessage?.timestamp || optimisticMessage.timestamp, // Ưu tiên server timestamp
    messageState: 'sent',
    isOptimistic: false,
    backendConfirmed: true,
    isFailed: false,
    error: undefined
  };
}; 