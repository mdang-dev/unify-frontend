'use client';

import { useRef } from 'react';
import { useToggleLike } from '@/src/hooks/use-toggle-like';
import { usePostLikeStatus } from '@/src/hooks/use-post-like-status';

const LikeButton = ({ userId, postId, className = '', classText = '' }) => {
  const lastClickRef = useRef(0);
  const { isLiked, setIsLiked, likeCount, setLikeCount } = usePostLikeStatus(userId, postId);

  const { like, unlike, isLoading } = useToggleLike(userId, postId);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 1000) return;
    lastClickRef.current = now;

    if (isLiked) {
      unlike(undefined, {
        onSuccess: () => {
          setIsLiked(false);
          setLikeCount((prev) => Math.max(prev - 1, 0));
        },
      });
    } else {
      like(undefined, {
        onSuccess: () => {
          setIsLiked(true);
          setLikeCount((prev) => prev + 1);
        },
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        className={`bg-transparent dark:text-white ${className}`}
        disabled={isLoading}
      >
        <i
          className={`${
            isLiked ? 'fa-solid text-red-500' : 'fa-regular'
          } fa-heart transition duration-300`}
        />
      </button>
      <p className={`text-md ${classText}`}>{likeCount}</p>
    </div>
  );
};

export default LikeButton;
