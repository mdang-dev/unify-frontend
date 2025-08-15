'use client';
import React, { useState, useRef, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const PhotoUploadField = ({ urls, setUrls, maxImages = 5, disabled = false }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((files) => {
    // Ensure urls is always an array
    if (!Array.isArray(urls)) {
      setUrls([]);
      return;
    }

    const selectedFiles = Array.from(files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    // Check if adding these files would exceed the limit
    if (urls.length + selectedFiles.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images.`);
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      // Validate file object structure
      if (!file || !file.type || !file.name || !file.size) {
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported image type.`);
        return false;
      }

      if (file.size > maxFileSize) {
        toast.error(`${file.name} exceeds the 10MB size limit.`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Create preview URLs and add to state
    const newImages = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setUrls(prev => {
      // Ensure prev is always an array
      if (!Array.isArray(prev)) {
        return newImages;
      }
      return [...prev, ...newImages];
    });
  }, [urls, maxImages, setUrls]);

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const removeImage = (imageId) => {
    setUrls(prev => {
      // Ensure prev is always an array
      if (!Array.isArray(prev)) {
        return [];
      }
      
      const imageToRemove = prev.find(img => img && img.id === imageId);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img && img.id !== imageId);
    });
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload Photos (Optional)
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Array.isArray(urls) ? urls.length : 0}/{maxImages} images
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        {(!Array.isArray(urls) || urls.length === 0) ? (
          <div className="space-y-3">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={disabled ? undefined : openFileSelector}
                  disabled={disabled}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Click to upload
                </button>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF, WEBP up to 10MB each
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.isArray(urls) && urls.map((image) => (
                image && image.id && image.preview && image.name ? (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={disabled ? undefined : () => removeImage(image.id)}
                      disabled={disabled}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                      {image.name}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
            
            {Array.isArray(urls) && urls.length < maxImages && (
              <button
                type="button"
                onClick={disabled ? undefined : openFileSelector}
                disabled={disabled}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                Add More Photos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Adding photos can help us better understand and address your report. 
        Photos are optional but recommended for content-related reports.
      </p>
    </div>
  );
};

export default PhotoUploadField;
