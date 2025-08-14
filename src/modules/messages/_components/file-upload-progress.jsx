'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import Image from 'next/image';

// File type configurations with custom icons from @/Pic
const FILE_TYPE_CONFIG = {
  // Images
  'image/jpeg': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Image', 
    color: 'bg-blue-500',
    isImage: true 
  },
  'image/jpg': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Image', 
    color: 'bg-blue-500',
    isImage: true 
  },
  'image/png': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Image', 
    color: 'bg-blue-500',
    isImage: true 
  },
  'image/gif': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Image', 
    color: 'bg-blue-500',
    isImage: true 
  },
  'image/webp': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Image', 
    color: 'bg-blue-500',
    isImage: true 
  },
  'image/svg+xml': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Image', 
    color: 'bg-blue-500',
    isImage: true 
  },
  
  // Videos
  'video/mp4': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Video', 
    color: 'bg-red-500',
    isVideo: true 
  },
  'video/webm': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Video', 
    color: 'bg-red-500',
    isVideo: true 
  },
  'video/ogg': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Video', 
    color: 'bg-red-500',
    isVideo: true 
  },
  'video/avi': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Video', 
    color: 'bg-red-500',
    isVideo: true 
  },
  'video/mov': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Video', 
    color: 'bg-red-500',
    isVideo: true 
  },
  
  // Audio
  'audio/mp3': { 
    icon: '/images/music-png-icon-9.png', 
    category: 'Audio', 
    color: 'bg-green-500',
    isAudio: true 
  },
  'audio/wav': { 
    icon: '/images/music-png-icon-9.png', 
    category: 'Audio', 
    color: 'bg-green-500',
    isAudio: true 
  },
  'audio/ogg': { 
    icon: '/images/music-png-icon-9.png', 
    category: 'Audio', 
    color: 'bg-green-500',
    isAudio: true 
  },
  'audio/aac': { 
    icon: '/images/music-png-icon-9.png', 
    category: 'Audio', 
    color: 'bg-green-500',
    isAudio: true 
  },
  
  // Documents
  'application/pdf': { 
    icon: '/images/pdf-icon.webp', 
    category: 'PDF', 
    color: 'bg-red-600',
    isDocument: true 
  },
  'application/msword': { 
    icon: '/images/word_icon.png', 
    category: 'Word', 
    color: 'bg-blue-600',
    isDocument: true 
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    icon: '/images/word_icon.png', 
    category: 'Word', 
    color: 'bg-blue-600',
    isDocument: true 
  },
  'application/vnd.ms-excel': { 
    icon: '/images/excel_icon.png', 
    category: 'Excel', 
    color: 'bg-green-600',
    isDocument: true 
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    icon: '/images/excel_icon.png', 
    category: 'Excel', 
    color: 'bg-green-600',
    isDocument: true 
  },
  'application/vnd.ms-powerpoint': { 
    icon: '/images/ppt_icon.png', 
    category: 'PowerPoint', 
    color: 'bg-orange-600',
    isDocument: true 
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { 
    icon: '/images/ppt_icon.png', 
    category: 'PowerPoint', 
    color: 'bg-orange-600',
    isDocument: true 
  },
  
  // Archives
  'application/zip': { 
    icon: '/images/file-zip-icon-11.png', 
    category: 'Archive', 
    color: 'bg-purple-500',
    isArchive: true 
  },
  'application/x-rar-compressed': { 
    icon: '/images/file-zip-icon-11.png', 
    category: 'Archive', 
    color: 'bg-purple-500',
    isArchive: true 
  },
  'application/x-7z-compressed': { 
    icon: '/images/file-zip-icon-11.png', 
    category: 'Archive', 
    color: 'bg-purple-500',
    isArchive: true 
  },
  
  // Code files
  'text/plain': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Text', 
    color: 'bg-gray-500',
    isCode: true 
  },
  'text/javascript': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Code', 
    color: 'bg-yellow-500',
    isCode: true 
  },
  'text/css': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Code', 
    color: 'bg-blue-500',
    isCode: true 
  },
  'text/html': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Code', 
    color: 'bg-orange-500',
    isCode: true 
  },
  'application/json': { 
    icon: '/images/media+format+icon.webp', 
    category: 'Code', 
    color: 'bg-yellow-500',
    isCode: true 
  },
};

const FileUploadProgress = ({ 
  files, 
  onRemove, 
  onClearAll,
  showFileInfo = true,
  className = ''
}) => {
  const [uploadProgress, setUploadProgress] = useState({});

  // Memoized file type info - optimized for performance
  const getFileTypeInfo = useCallback((fileType) => {
    return FILE_TYPE_CONFIG[fileType] || { 
      icon: null, 
      category: 'File', 
      color: 'bg-gray-500' 
    };
  }, []);

  // Format file size with proper units - memoized for performance
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Handle file removal
  const handleRemove = (index) => {
    if (onRemove) {
      onRemove(index);
    }
    // Clean up progress state
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  // Update upload progress
  useEffect(() => {
    files.forEach((fileObj, index) => {
      if (fileObj.uploadProgress !== undefined) {
        setUploadProgress(prev => ({
          ...prev,
          [index]: fileObj.uploadProgress
        }));
      }
    });
  }, [files]);

  // Early return if no files
  if (!files || files.length === 0) {
    return null;
  }

  // Calculate total size - memoized for performance
  const totalSize = useMemo(() => {
    return files.reduce((total, fileObj) => total + fileObj.file.size, 0);
  }, [files]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-neutral-700 dark:bg-neutral-700 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </span>
          <span className="text-xs text-neutral-400">
            {formatFileSize(totalSize)}
          </span>
        </div>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors border border-red-500 rounded-lg hover:bg-red-500/10"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Files grid with horizontal scroll */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
          {files.map((fileObj, index) => {
            const file = fileObj.file;
            const fileTypeInfo = getFileTypeInfo(file.type);
            const progress = uploadProgress[index] || 0;

            return (
              <div
                key={`${file.name}-${index}`}
                className="relative bg-neutral-700 dark:bg-neutral-700 border border-neutral-600 dark:border-neutral-600 rounded-lg p-3 shadow-sm transition-all duration-200 hover:border-neutral-500 flex-shrink-0 group"
                style={{ width: '160px' }}
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 z-10 p-1 text-neutral-400 hover:text-red-400 transition-colors bg-neutral-600 dark:bg-neutral-600 rounded-full shadow-sm hover:bg-neutral-500 opacity-0 group-hover:opacity-100"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* File content */}
                <div className="mt-2 text-center">


                  {/* File name */}
                  <p className="text-xs font-medium text-white truncate mb-1 px-1" title={file.name}>
                    {file.name}
                  </p>



                  {/* File info */}
                  <div className="text-xs text-neutral-400 dark:text-neutral-400 mb-2">
                    <div>{formatFileSize(file.size)}</div>
                  </div>

                  {/* File icon or preview */}
                  <div className="mt-2">
                    {file.type.startsWith('image/') && (fileObj.preview || fileObj.base64Data) ? (
                      // Show image preview for image files
                      <div className="w-16 h-16 mx-auto">
                        <img
                          src={fileObj.preview || fileObj.base64Data}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg border border-neutral-500 dark:border-neutral-500 mx-auto"
                          loading="lazy"
                        />
                      </div>
                    ) : fileTypeInfo.isImage ? (
                      // Custom CSS icon for images without preview
                      <div className="w-16 h-16 mx-auto bg-blue-500 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-6 bg-white rounded-sm relative">
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                      </div>
                    ) : fileTypeInfo.icon ? (
                      // Show specific icon for other file types
                      <div className="w-16 h-16 mx-auto relative">
                        <Image
                          src={fileTypeInfo.icon}
                          alt={fileTypeInfo.category}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      // Fallback icon
                      <div className="w-16 h-16 mx-auto bg-neutral-600 rounded-lg flex items-center justify-center">
                        <Upload className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload progress */}
                  {progress > 0 && progress < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-neutral-600 dark:bg-neutral-600 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-400 mt-1">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Status indicators */}
                <div className="absolute bottom-2 right-2">
                  {progress === 100 && (
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Upload complete" />
                  )}
                  {progress > 0 && progress < 100 && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Uploading" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer summary */}
      {/* <div className="flex items-center justify-between p-3 bg-neutral-600 dark:bg-neutral-600 rounded-lg">
        <div className="text-sm text-neutral-300 dark:text-neutral-300">
          Total: {files.length} file{files.length !== 1 ? 's' : ''}
        </div>
        <div className="text-sm text-neutral-300 dark:text-neutral-300">
          {formatFileSize(totalSize)}
        </div>
      </div> */}
    </div>
  );
};

export default FileUploadProgress;