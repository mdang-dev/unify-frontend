'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export const OptimizedImage = ({ 
  src, 
  alt, 
  width = 40, 
  height = 40, 
  className = '',
  fallbackSrc = '/images/unify_icon_2.png',
  priority = false,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-full"
          style={{ width, height }}
        />
      )}
      
      <Image
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
    </div>
  );
}; 