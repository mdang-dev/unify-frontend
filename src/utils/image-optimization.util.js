/**
 * Image optimization utilities for frontend preview and base64 conversion
 */

/**
 * Convert image to base64 for immediate preview
 * @param {File} file - Image file to convert
 * @param {number} maxWidth - Maximum width for preview
 * @param {number} maxHeight - Maximum height for preview
 * @returns {Promise<string>} Base64 data URL
 */
export const convertToBase64 = async (file, maxWidth = 800, maxHeight = 600) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions while maintaining aspect ratio
      const { width, height } = getOptimalDimensions(img.width, img.height, maxWidth, maxHeight);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64);
    };
    
    img.onerror = () => {
      // Fallback to original file URL if conversion fails
      resolve(URL.createObjectURL(file));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Create thumbnail for image preview
 * @param {File} file - Image file to create thumbnail for
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<string>} Base64 thumbnail data URL
 */
export const createThumbnail = async (file, size = 160) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions for square thumbnail
      const { width, height } = getOptimalDimensions(img.width, img.height, size, size);
      
      canvas.width = size;
      canvas.height = size;
      
      // Center the image in the square
      const offsetX = (size - width) / 2;
      const offsetY = (size - height) / 2;
      
      // Draw image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, offsetX, offsetY, width, height);
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(base64);
    };
    
    img.onerror = () => {
      // Fallback to original file URL if conversion fails
      resolve(URL.createObjectURL(file));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get file metadata (name, size, type, etc.)
 * @param {File} file - File to get metadata for
 * @returns {Object} File metadata
 */
export const getFileMetadata = (file) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    extension: file.name.split('.').pop()?.toLowerCase(),
  };
};

/**
 * Batch convert multiple images to base64
 * @param {File[]} files - Array of image files
 * @param {number} maxWidth - Maximum width for preview
 * @param {number} maxHeight - Maximum height for preview
 * @returns {Promise<Array>} Array of base64 data URLs
 */
export const batchConvertToBase64 = async (files, maxWidth = 800, maxHeight = 600) => {
  const promises = files.map(file => convertToBase64(file, maxWidth, maxHeight));
  return Promise.all(promises);
};

/**
 * Check if file is an image
 * @param {File} file - File to check
 * @returns {boolean} True if file is an image
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {Object} Optimal width and height
 */
export const getOptimalDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Calculate aspect ratio
  const aspectRatio = width / height;
  
  // Scale down if dimensions exceed maximum
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Get optimal image format based on file type and quality requirements
 * @param {string} mimeType - Original MIME type
 * @param {string} quality - Quality requirement ('low', 'medium', 'high')
 * @returns {string} Optimal format
 */
export const getOptimalFormat = (mimeType, quality = 'medium') => {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return quality === 'high' ? 'image/jpeg' : 'image/webp';
  }
  
  if (mimeType.includes('png')) {
    return quality === 'high' ? 'image/png' : 'image/webp';
  }
  
  if (mimeType.includes('webp')) {
    return 'image/webp';
  }
  
  // Default to JPEG for other formats
  return 'image/jpeg';
}; 