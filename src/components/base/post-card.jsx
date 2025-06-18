'use client';

import React from 'react';
import Image from 'next/image';
import iconHeart from '@/public/heart.svg';
import iconComment from '@/public/comment.svg';
import { usePostLikeStatus } from '@/src/hooks/use-post-like-status';
import { useAuthStore } from '@/src/stores/auth.store';

export default function PostCard({ post, onClick, style, postId }) {
  const { user } = useAuthStore();
  const { likeCount } = usePostLikeStatus(user?.id, postId);

  const hasMedia = post?.media && post.media.length > 0;
  const media = hasMedia ? post.media[0] : null;
  const isVideo = hasMedia && media.mediaType === 'VIDEO';

  return (
    <div
      onClick={() => onClick && onClick(post)}
      className="group/item relative h-full w-full cursor-pointer"
      style={{
        ...style,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {hasMedia ? (
        <div className="relative h-full w-full">
          {isVideo ? (
            <video src={media.url} controls={false} className="h-full w-full object-cover" />
          ) : (
            <Image
              src={media.url}
              alt="Post Media"
              width={500}
              height={500}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="pointer-events-none absolute right-3 top-2 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
            {isVideo ? (
              <i className="fa-solid fa-film" />
            ) : (
              <i className="fa-solid fa-layer-group" />
            )}
          </div>
        </div>
      ) : null}

      <div className="invisible absolute inset-0 flex h-full items-center justify-center gap-2 bg-black bg-opacity-0 transition-opacity duration-300 group-hover/item:visible group-hover/item:bg-opacity-65">
        <div className="flex items-center text-white">
          <Image src={iconHeart} width={20} height={20} alt="Like" />
          <p className="ml-1 text-lg font-bold">{likeCount}</p>
        </div>
        <div className="flex items-center text-white">
          <Image src={iconComment} width={20} height={20} alt="Comment" />

          <p className="ml-1 text-lg font-bold">{post.commentCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
