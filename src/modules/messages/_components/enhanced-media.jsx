'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import Image from 'next/image';

// Enhanced media types configuration with custom icons from @/Pic
const MEDIA_TYPES = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    icon: '/images/media+format+icon.webp',
    component: 'img',
    canPreview: true
  },
  video: {
    extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'],
    icon: '/images/media+format+icon.webp',
    component: 'video',
    canPreview: true
  },
  audio: {
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
    icon: '/images/music-png-icon-9.png',
    component: 'audio',
    canPreview: true
  },
  document: {
    extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    icon: '/images/word_icon.png',
    component: 'document',
    canPreview: false
  },
  spreadsheet: {
    extensions: ['xls', 'xlsx', 'csv'],
    icon: '/images/excel_icon.png',
    component: 'spreadsheet',
    canPreview: false
  },
  presentation: {
    extensions: ['ppt', 'pptx'],
    icon: '/images/ppt_icon.png',
    component: 'presentation',
    canPreview: false
  },
  archive: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    icon: '/images/file-zip-icon-11.png',
    component: 'archive',
    canPreview: false
  },
  code: {
    extensions: ['js', 'ts', 'jsx', 'tsx', 'css', 'html', 'json', 'xml', 'py', 'java', 'cpp', 'c'],
    icon: '/images/media+format+icon.webp',
    component: 'code',
    canPreview: false
  },
  other: {
    extensions: [],
    icon: '/images/media+format+icon.webp',
    component: 'other',
    canPreview: false
  }
};

// Lazy loading configuration
const LAZY_CONFIG = {
  threshold: 0.1,
  rootMargin: '50px',
  placeholder: {
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
    video: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIHByZXZpZXc8L3RleHQ+PC9zdmc+'
  }
};

const EnhancedMedia = ({ 
  fileUrl, 
  fileName, 
  fileType, 
  thumbnailUrl, 
  base64Data,
  variants = {}, 
  onLoad, 
  onError,
  className = '',
  showControls = true,
  lazyLoad = true,
  maxWidth = '500px',
  maxHeight = '400px'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('medium');
  const [showFullSize, setShowFullSize] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  const mediaRef = useRef(null);
  const observerRef = useRef(null);

  // Determine media type - optimized with early returns
  const getMediaType = useCallback((url, type) => {
    // Early return for known MIME types
    if (type) {
      if (type.startsWith('image/')) return 'image';
      if (type.startsWith('video/')) return 'video';
      if (type.startsWith('audio/')) return 'audio';
      if (type === 'application/pdf') return 'document';
      if (type.includes('word') || type.includes('document')) return 'document';
      if (type.includes('excel') || type.includes('spreadsheet')) return 'spreadsheet';
      if (type.includes('powerpoint') || type.includes('presentation')) return 'presentation';
      if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'archive';
      if (type.includes('javascript') || type.includes('css') || type.includes('html') || type.includes('json')) return 'code';
    }
    
    // Fallback to extension-based detection
    const extension = url?.split('.').pop()?.toLowerCase();
    if (extension) {
      for (const [mediaType, config] of Object.entries(MEDIA_TYPES)) {
        if (config.extensions.includes(extension)) {
          return mediaType;
        }
      }
    }
    
    return 'other';
  }, []);

  const mediaType = getMediaType(fileUrl, fileType);
  const MediaIcon = MEDIA_TYPES[mediaType]?.icon || File;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) {
      setIsIntersecting(true);
      return;
    }

    // Nếu đã có data thì không cần lazy load
    if (fileUrl || base64Data) {
      setIsIntersecting(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      },
      LAZY_CONFIG
    );

    if (mediaRef.current) {
      observerRef.current.observe(mediaRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazyLoad, fileUrl, base64Data]);

  // Handle media load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Timeout để tránh loading vô hạn
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        console.warn('Media loading timeout for:', fileName);
      }, 10000); // 10 giây timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, fileName]);

  // Handle media error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Get optimal URL based on current quality - optimized with early returns
  const getOptimalUrl = useCallback(() => {
    // Return placeholder if not intersecting
    if (!isIntersecting) {
      return LAZY_CONFIG.placeholder[mediaType] || LAZY_CONFIG.placeholder.image;
    }
    
    // Priority: base64 > thumbnail > original URL
    if (base64Data && mediaType === 'image') {
      return base64Data;
    }
    
    if (thumbnailUrl) {
      return thumbnailUrl;
    }
    
    return fileUrl;
  }, [isIntersecting, base64Data, thumbnailUrl, fileUrl, mediaType]);

  // Set loading state khi có URL và chưa load
  useEffect(() => {
    if (fileUrl && !isLoaded && !hasError) {
      setIsLoading(true);
    }
  }, [fileUrl, isLoaded, hasError]);

  // Quality selector component - Simplified for base64 approach
  const QualitySelector = () => {
    // Only show if we have base64 data for immediate display
    if (!thumbnailUrl && !base64Data) return null;

    return (
      <div className="absolute top-2 right-2 bg-black/70 rounded-lg p-1 text-white text-xs">
        <span className="text-white px-2 py-1">Preview</span>
      </div>
    );
  };

  // Render different media types
  const renderMedia = () => {
    const url = getOptimalUrl();
    
    switch (mediaType) {
      case 'image':
        return (
          <img
            ref={mediaRef}
            src={url}
            alt={fileName || 'Image'}
            className={cn(
              'w-full h-auto object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            style={{ maxWidth, maxHeight }}
            onLoad={handleLoad}
            onError={handleError}
            loading={lazyLoad ? 'lazy' : 'eager'}
          />
        );

      case 'video':
        return (
          <video
            ref={mediaRef}
            src={url}
            controls={showControls}
            className={cn(
              'w-full h-auto object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            style={{ maxWidth, maxHeight }}
            onLoadedData={handleLoad}
            onError={handleError}
            preload={lazyLoad ? 'metadata' : 'auto'}
            poster={thumbnailUrl || variants.thumbnail}
          />
        );

      case 'audio':
        return (
          <audio
            ref={mediaRef}
            src={url}
            controls={showControls}
            className="w-full"
            onLoadedData={handleLoad}
            onError={handleError}
            preload={lazyLoad ? 'metadata' : 'auto'}
          />
        );

      case 'document':
        return (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/images/word_icon.png"
                alt="Document"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {fileName || 'Document'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Document file
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );

      case 'spreadsheet':
        return (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/images/excel_icon.png"
                alt="Spreadsheet"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {fileName || 'Spreadsheet'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Excel file
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );

      case 'presentation':
        return (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/images/ppt_icon.png"
                alt="Presentation"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {fileName || 'Presentation'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                PowerPoint file
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs rounded-md hover:bg-orange-600 transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );

      case 'archive':
        return (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/images/file-zip-icon-11.png"
                alt="Archive"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {fileName || 'Archive'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Compressed file
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );

      case 'code':
        return (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/images/media+format+icon.webp"
                alt="Code"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {fileName || 'Code'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Source code file
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/images/media+format+icon.webp"
                alt="File"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {fileName || 'File'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Unknown file type
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-500 text-white text-xs rounded-md hover:bg-neutral-600 transition-colors flex-shrink-0"
              title="Download file"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );
    }
  };

  // Loading skeleton - chỉ hiển thị khi thực sự cần
  if (!isIntersecting && lazyLoad) {
    return (
      <div 
        ref={mediaRef}
        className={cn(
          'bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-lg',
          className
        )}
        style={{ 
          width: maxWidth, 
          height: maxHeight,
          minHeight: '120px'
        }}
      />
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg',
        className
      )}>
        <div className="text-center">
          <MediaIcon size={48} className="mx-auto mb-2 text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Failed to load media
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              // Retry loading
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative group', className)}>
      {/* Quality selector */}
      <QualitySelector />
      
      {/* Full size toggle for images */}
      {mediaType === 'image' && (
        <button
          onClick={() => setShowFullSize(!showFullSize)}
          className="absolute top-2 left-2 bg-black/70 rounded-lg p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title={showFullSize ? 'Show normal size' : 'Show full size'}
        >
          {showFullSize ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}

      {/* Media content */}
      <div
        className={cn(
          'transition-all duration-300',
          showFullSize && mediaType === 'image' ? 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center' : ''
        )}
      >
        {showFullSize && mediaType === 'image' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={fileUrl}
              alt={fileName || 'Image'}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-lg hover:bg-black/90 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          renderMedia()
        )}
      </div>

      {/* Loading indicator - chỉ hiển thị khi thực sự loading */}
      {isLoading && !isLoaded && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMedia; 