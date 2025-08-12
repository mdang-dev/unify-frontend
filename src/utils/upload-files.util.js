import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../configs/supabase.config';
import { convertToBase64, createThumbnail, getFileMetadata } from './image-optimization.util';

// Upload configuration
const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  createThumbnails: true,
  convertToBase64: true,
  parallelUploads: 3
};

/**
 * Simple file upload without optimization
 * @param {Array} files - Array of file objects with file and preview properties
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of uploaded file URLs with metadata
 */
export const uploadFiles = async (files, options = {}) => {
  const config = { ...UPLOAD_CONFIG, ...options };
  const results = [];

  // Process files in batches to avoid overwhelming the browser
  const processBatch = async (batch) => {
    const batchPromises = batch.map(async (item) => {
    const file = item.file;
      if (!file || !file.name) return null;

      try {
        let thumbnailUrl = null;
        let base64Data = null;

        // Create thumbnail and base64 for immediate display if enabled
        if (config.createThumbnails && file.type.startsWith('image/')) {
          thumbnailUrl = await createThumbnail(file, 150);
        }

        if (config.convertToBase64 && file.type.startsWith('image/')) {
          base64Data = await convertToBase64(file, 0.8);
        }

        // Get file metadata
        const metadata = await getFileMetadata(file);

        // Generate unique filename
        const fileId = uuidv4();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${fileId}.${fileExtension}`;

        // Upload original file (no optimization)
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(fileName, file, { 
            cacheControl: '3600', 
            upsert: false 
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${fileName}`;

        return {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl,
          thumbnailUrl,
          base64Data,
          metadata,
          uploadedAt: new Date().toISOString()
        };

      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        return {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          error: error.message,
          url: null
        };
      }
    });

    return Promise.all(batchPromises);
  };

  // Process files in parallel batches
  for (let i = 0; i < files.length; i += config.parallelUploads) {
    const batch = files.slice(i, i + config.parallelUploads);
    const batchResults = await processBatch(batch);
    results.push(...batchResults.filter(Boolean));
  }

  return results;
};

/**
 * Upload single file
 * @param {Object} fileObj - File object with file and preview properties
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadSingleFile = async (fileObj, options = {}) => {
  const results = await uploadFiles([fileObj], options);
  return results[0];
};

/**
 * Upload files with progress tracking
 * @param {Array} files - Array of file objects
 * @param {Function} onProgress - Progress callback
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Upload results
 */
export const uploadFilesWithProgress = async (files, onProgress, options = {}) => {
  const totalFiles = files.length;
  let completedFiles = 0;
  const results = [];

  const updateProgress = () => {
    const progress = (completedFiles / totalFiles) * 100;
    onProgress(progress, completedFiles, totalFiles);
  };

  // Process files sequentially for better progress tracking
  for (const file of files) {
    try {
      const result = await uploadSingleFile(file, options);
      results.push(result);
      completedFiles++;
      updateProgress();
    } catch (error) {
      console.error('File upload failed:', error);
      results.push({
        id: uuidv4(),
        name: file.file.name,
        type: file.file.type,
        size: file.file.size,
        error: error.message,
        url: null
      });
      completedFiles++;
      updateProgress();
    }
  }

  return results;
};

/**
 * Clean up uploaded files (for error handling)
 * @param {Array} fileIds - Array of file IDs to delete
 * @returns {Promise<boolean>} - Success status
 */
export const cleanupUploadedFiles = async (fileIds) => {
  try {
    const deletePromises = fileIds.map(async (fileId) => {
    const { error } = await supabase.storage
      .from('files')
        .remove([fileId]);

    if (error) {
        console.warn(`Failed to delete file ${fileId}:`, error);
      }
      
      return !error;
    });

    const results = await Promise.all(deletePromises);
    return results.every(Boolean);
  } catch (error) {
    console.error('Cleanup failed:', error);
    return false;
      }
};

/**
 * Get file metadata from URL
 * @param {string} url - File URL
 * @returns {Promise<Object>} - File metadata
 */
export const getFileMetadataFromUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw new Error('Failed to fetch file metadata');
    
    return {
      size: response.headers.get('content-length'),
      type: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified'),
      etag: response.headers.get('etag')
    };
  } catch (error) {
    console.warn('Failed to get file metadata:', error);
    return null;
  }
};

/**
 * Prepare files for immediate display (convert to base64)
 * @param {Array} files - Array of file objects
 * @returns {Promise<Array>} - Files with base64 previews
 */
export const prepareFilesForDisplay = async (files) => {
  const results = [];
  
  for (const fileObj of files) {
    const file = fileObj.file;
    
    try {
      let base64Data = null;
      let thumbnailUrl = null;
      
      if (file.type.startsWith('image/')) {
        // Convert to base64 for immediate display
        base64Data = await convertToBase64(file, 0.8);
        // Create thumbnail
        thumbnailUrl = await createThumbnail(file, 150);
      }
      
      results.push({
        ...fileObj,
        base64Data,
        thumbnailUrl,
        metadata: await getFileMetadata(file)
      });
      
    } catch (error) {
      console.warn(`Failed to prepare file ${file.name}:`, error);
      results.push({
        ...fileObj,
        base64Data: null,
        thumbnailUrl: null,
        metadata: { type: 'other', size: file.size, name: file.name }
      });
    }
  }

  return results;
};
