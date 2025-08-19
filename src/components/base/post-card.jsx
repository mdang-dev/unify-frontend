'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import iconHeart from '@/public/heart.svg';
import iconComment from '@/public/comment.svg';
import { usePostLikeStatus } from '@/src/hooks/use-post-like-status';
import { useAuthStore } from '@/src/stores/auth.store';

export default function PostCard({ post, onClick, style, postId }) {
  const { user } = useAuthStore();
  const { likeCount } = usePostLikeStatus(user?.id, postId);
  const [isVisible, setIsVisible] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cardRef = useRef(null);

  // Validate post data
  if (!post || !post.id) {
    return (
      <div className="h-full w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg">
        <div className="flex items-center justify-center h-full text-gray-500">
          Invalid post data
        </div>
      </div>
    );
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only trigger once
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Start loading 50px before the card is visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const hasMedia = post?.media && Array.isArray(post.media) && post.media.length > 0;
  const media = hasMedia ? post.media[0] : null;
  const isVideo = hasMedia && media && media.mediaType === 'VIDEO';

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleClick = () => {
    if (onClick && post) {
      onClick(post);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="group/item relative h-full w-full cursor-pointer rounded-lg shadow-md hover:shadow-xl transition-all duration-300 dark:shadow-gray-800/40 dark:hover:shadow-gray-700/60"
      style={{
        ...style,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {hasMedia && isVisible ? (
        <div className="relative h-full w-full">
          {isVideo ? (
            <video
              src={media.url}
              controls={false}
              className="h-full w-full object-cover rounded-lg"
              preload="metadata"
            />
          ) : (
            <>
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
              )}
              <Image
                src={media.url}
                alt="Post Media"
                width={500}
                height={500}
                className={`h-full w-full object-cover rounded-lg transition-opacity duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={handleImageLoad}
                priority={false}
              />
            </>
          )}
          <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
            {isVideo ? (
              <i className="fa-solid fa-film" />
            ) : (
              <i className="fa-solid fa-layer-group" />
            )}
          </div>
        </div>
      ) : (
        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}

      <div className="invisible absolute inset-0 flex h-full items-center justify-center gap-2 bg-black bg-opacity-0 transition-all duration-300 group-hover/item:visible group-hover/item:bg-opacity-65 rounded-lg">
        <div className="flex items-center text-white">
          <Image src={iconHeart} width={18} height={18} alt="Like" />
          <p className="ml-1 text-base font-bold">{likeCount || 0}</p>
        </div>
        <div className="flex items-center text-white">
          <Image src={iconComment} width={18} height={18} alt="Comment" />
          <p className="ml-1 text-base font-bold">{post.commentCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
