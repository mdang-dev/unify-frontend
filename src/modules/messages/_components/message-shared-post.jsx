'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const PostDetailModal = dynamic(() => import('@/src/components/base/post-detail-modal'), {
  ssr: false,
});

const SharedPost = ({ postId, preview, onPostClick }) => {
  const [openPostId, setOpenPostId] = useState(null);

  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(postId);
    } else {
      setOpenPostId(postId);
    }
  };

  if (!preview) {
    return (
      <div className="inline-block min-w-[200px] animate-pulse rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 shadow-sm dark:from-neutral-800 dark:to-neutral-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-600"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-600"></div>
            <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-600"></div>
          </div>
        </div>
      </div>
    );
  }

  let mediaItem = Array.isArray(preview.media)
    ? preview.media.find((m) => m && (m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO'))
    : null;
  let mediaUrl = mediaItem?.url || '/images/A_black_image.jpg';
  let isVideo = mediaItem?.mediaType === 'VIDEO';

  return (
    <>
      <div
        className="group relative min-w-[280px] max-w-sm transform-gpu cursor-pointer rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gray-200 hover:shadow-xl dark:border-neutral-600 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-600 dark:hover:border-neutral-500"
        onClick={handlePostClick}
      >
        {/* User Info Section */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative">
            <img
              src={preview.user?.avatar?.url || '/images/avatar.png'}
              alt="avatar"
              className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-md dark:border-neutral-600"
            />
            </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {preview.user?.username}
            </h4>
          </div>
        </div>

        {/* Media and Content Section */}
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-md dark:from-neutral-600 dark:to-neutral-700">
            {isVideo ? (
              <video
                src={mediaUrl}
                className="h-20 w-20 rounded-xl object-cover"
                preload="metadata"
                controls={false}
                muted
                playsInline
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <img src={mediaUrl} alt="media" className="h-20 w-20 rounded-xl object-cover" />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-end justify-center rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent pb-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
                View Post
              </span>
            </div>

            {/* Video indicator */}
            {isVideo && (
              <div className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 backdrop-blur-sm">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2H2zm4.5 5.5l5-2.5a.5.5 0 010 .9l-5 2.5a.5.5 0 01-.7-.7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1">
            <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              {preview.captions || 'Không có mô tả'}
            </p>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      </div>

      {/* Post Detail Modal */}
      {openPostId && <PostDetailModal postId={openPostId} onClose={() => setOpenPostId(null)} />}
    </>
  );
};

export default SharedPost;
