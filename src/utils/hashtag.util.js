/**
 * Utility functions for hashtag processing
 */

/**
 * Extract hashtags from text
 * @param {string} text - Text to extract hashtags from
 * @returns {string[]} - Array of hashtags (without # symbol)
 */
export function extractHashtags(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const hashtag = match[1];
    if (!hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }

  return hashtags;
}

/**
 * Generate hashtag objects for backend API
 * @param {string[]} hashtags - Array of hashtag strings
 * @returns {Object[]} - Array of hashtag objects
 */
export function generateHashtagObjects(hashtags) {
  return hashtags.map(hashtag => ({
    content: hashtag,
  }));
}

/**
 * Generate hashtag detail objects for backend API
 * @param {Array} hashtags - Array of saved hashtag objects with IDs
 * @param {Object} post - Post object
 * @returns {Object[]} - Array of hashtag detail objects
 */
export function generateHashtagDetailObjects(hashtags, post) {
  return hashtags.map(hashtag => ({
    hashtagId: hashtag.id,
    postId: post.id,
  }));
}
