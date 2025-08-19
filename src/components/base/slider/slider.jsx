import { Spinner } from '@heroui/react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import PostVideo from './_components/post-video';
import { motion, AnimatePresence } from 'framer-motion';

const Slider = ({ srcs = [], onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(4 / 5);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const loadingTimeoutRef = useRef(null);
  const preloadRef = useRef({});

  // Preload next and previous images
  const preloadMedia = useCallback(
    (index) => {
      if (!srcs[index]) return;

      const media = srcs[index];
      if (preloadRef.current[media.url]) return;

      if (isVideo(media)) {
        const video = document.createElement('video');
        video.src = media.url;
        video.preload = 'metadata';
        video.muted = true;
        preloadRef.current[media.url] = video;
      } else {
        const imgElement = new window.Image();
        imgElement.src = media.url;
        preloadRef.current[media.url] = imgElement;
      }
    },
    [srcs]
  );

  useEffect(() => {
    // Preload next and previous images
    if (currentIndex > 0) preloadMedia(currentIndex - 1);
    if (currentIndex < srcs.length - 1) preloadMedia(currentIndex + 1);
  }, [currentIndex, preloadMedia, srcs.length]);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      currentXRef.current = e.touches[0].clientX;
      const diff = currentXRef.current - startXRef.current;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
          setIsDragging(false);
        } else if (diff < 0 && currentIndex < srcs.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setIsDragging(false);
        }
      }
    },
    [currentIndex, isDragging, srcs.length]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDotClick = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const isVideo = useCallback((src) => {
    return src?.url?.toLowerCase().endsWith('.mp4') || src?.type === 'video';
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Set a maximum loading time of 300ms
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [srcs, currentIndex]);

  // Function to calculate aspect ratio with consistent sizing
  const calculateAspectRatio = useCallback((media) => {
    if (!media) return 4 / 5;

    if (media.width && media.height) {
      const ratio = media.width / media.height;
      // Use consistent aspect ratios to prevent layout shifts
      if (ratio >= 1.5) {
        return 16 / 9; // Landscape
      } else if (ratio <= 0.75) {
        return 3 / 4; // Portrait
      } else {
        return 4 / 5; // Square-ish
      }
    }

    return 4 / 5; // Default fallback
  }, []);

  useEffect(() => {
    if (srcs[currentIndex]) {
      const newAspectRatio = calculateAspectRatio(srcs[currentIndex]);
      // Only update if the change is significant to prevent micro-adjustments
      if (Math.abs(newAspectRatio - mediaAspectRatio) > 0.1) {
        setMediaAspectRatio(newAspectRatio);
      }
    }
  }, [currentIndex, srcs, calculateAspectRatio, mediaAspectRatio]);

  // Consistent container style to prevent layout shifts
  const containerStyle = {
    aspectRatio: mediaAspectRatio,
    minHeight: '300px',
    maxHeight: '700px', // Fixed max height instead of viewport-based
  };

  return (
    <div
      ref={sliderRef}
      className="relative w-full overflow-hidden"
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm dark:bg-neutral-900/80"
          >
            <Spinner
              classNames={{
                label: 'text-gray-700 dark:text-gray-200 mt-4 font-medium',
                base: 'text-primary',
              }}
              label="Loading media..."
              variant="wave"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {srcs[currentIndex] == null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-200 dark:bg-neutral-800"
        >
          <i className="fa-solid fa-triangle-exclamation mb-3 text-3xl text-red-500"></i>
          <p className="font-medium text-gray-700 dark:text-gray-200">
            This media is no longer available
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative flex h-full w-full items-center justify-center bg-black"
        >
          {isVideo(srcs[currentIndex]) ? (
            <PostVideo src={srcs[currentIndex]?.url} />
          ) : (
            <img
              src={srcs[currentIndex]?.url || '/images/unify_icon_2.png'}
              alt={`Post media ${currentIndex + 1}`}
              className="max-h-full max-w-full cursor-pointer object-contain"
              onClick={onImageClick}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {srcs.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 transform space-x-1">
          {srcs.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex ? 'scale-125 bg-white' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {srcs.length > 1 && isHovered && (
        <>
          {currentIndex > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </motion.button>
          )}
          {currentIndex < srcs.length - 1 && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </motion.button>
          )}
        </>
      )}
    </div>
  );
};

export default Slider;
