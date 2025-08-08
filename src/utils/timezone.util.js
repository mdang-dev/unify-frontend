/**
 * Utility functions for handling Vietnam timezone
 * Optimized for performance and simplicity
 */

/**
 * Lấy thời gian hiện tại theo timezone Việt Nam
 * @returns {string} ISO string theo timezone Việt Nam
 */
export const getVietnamTimeISO = () => {
  try {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    return vietnamTime.toISOString();
  } catch (error) {
    // Fallback to current time if timezone conversion fails
    return new Date().toISOString();
  }
};

/**
 * Chuyển đổi timestamp sang timezone Việt Nam
 * @param {string|Date} timestamp - Timestamp cần chuyển đổi
 * @returns {string} ISO string theo timezone Việt Nam
 */
export const toVietnamTimeISO = (timestamp) => {
  if (!timestamp) {
    return getVietnamTimeISO();
  }
  
  try {
    const date = new Date(timestamp);
    const vietnamTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    return vietnamTime.toISOString();
  } catch (error) {
    // Fallback to original timestamp if conversion fails
    return new Date(timestamp).toISOString();
  }
}; 