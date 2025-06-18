'use client';

import React, { useState, useCallback } from 'react';
import LikeButton from '@/src/components/button/like-button';
import CommentButton from '@/src/components/base/comment-button';
import ShareButton from '@/src/components/button/share-button';
import Bookmark from '@/src/components/base/bookmark';
import Slider from '@/src/components/base/slider';
import { usePostLikeStatus } from '@/src/hooks/use-post-like-status';
import { addToast } from '@heroui/react';
import Link from 'next/link';
import ReportModal from '@/src/components/base/report-modal';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMutation } from '@tanstack/react-query';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import Caption from './_components/caption';
import Hashtag from './_components/hashtag';
import User from './_components/user';

const PostItem = ({ post }) => {
  const { user } = useAuthStore();
  const { likeCount, setLikeCount } = usePostLikeStatus(user?.id, post?.id);
  const [openList, setOpenList] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const { mutate: reportPost } = useMutation({
    mutationFn: ({ endpoint, reportId, reason }) =>
      reportsCommandApi.createReport(endpoint, reportId, reason),
    onSuccess: (data) => {
      if (data?.error) {
        const isDuplicate = data.error === 'You have reported this content before.';

        addToast({
          title: isDuplicate ? 'Fail to report post' : 'Encountered an error',
          description: isDuplicate ? data.error : `Error: ${data.error}`,
          timeout: 3000,

          color: isDuplicate ? 'warning' : 'danger',
        });
      } else {
        addToast({
          title: 'Success',
          description: 'Report post successful.',
          timeout: 3000,

          color: 'success',
        });
      }

      setIsModalOpen(false);
    },
    onError: (error) => {
      addToast({
        title: 'Network Error',
        description: error?.message || 'Something went wrong',
        timeout: 3000,

        color: 'danger',
      });
      setIsModalOpen(false);
    },
  });

  const handleReportPost = useCallback(
    async (postId, reason) => {
      reportPost({ endpoint: 'post', reportId: postId, reason });
    },
    [reportPost]
  );

  const hashtags = post.captions.split(/(\#[a-zA-Z0-9_]+)/g).filter((part) => part.startsWith('#'));

  const transformHashtags = (text) => {
    return text.split(/(\#[a-zA-Z0-9_]+)/g).map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Link
            key={index}
            href={`/explore/${part.substring(1)}`}
            className="text-blue-500 transition-colors hover:underline dark:text-blue-400"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-lg dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
          <User user={post.user} />
          <button
            onClick={() => setOpenList(true)}
            className="text-lg text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            •••
          </button>
        </div>

        {openList && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-64 rounded-lg bg-white shadow-xl dark:bg-neutral-800"
            >
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setOpenList(false);
                }}
                className="w-full rounded-t-lg py-3 text-sm font-medium text-red-500 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-neutral-700"
              >
                Report
              </button>
              <button className="w-full py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700">
                Not interested
              </button>
              <button className="w-full py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700">
                Share
              </button>
              <button
                onClick={() => setOpenList(false)}
                className="w-full rounded-b-lg py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleReportPost}
          postId={post.id}
        />

        <div className="w-full bg-white dark:bg-neutral-900">
          <div className="relative max-h-[600px] overflow-hidden">
            <Slider srcs={post.media} onImageClick={() => setShowFullImage(true)} />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex justify-between text-base">
            <div className="flex gap-4">
              <LikeButton
                className="!text-xl transition-opacity hover:opacity-50"
                userId={user?.id}
                postId={post?.id}
                setLikeCount={setLikeCount}
                classText="hidden"
              />
              <CommentButton
                className="!text-xl transition-opacity hover:opacity-50"
                postId={post.id}
              >
                <i className="fa-regular fa-comment"></i>
              </CommentButton>
              <ShareButton className="!text-xl transition-opacity hover:opacity-50" />
            </div>
            <Bookmark
              postId={post.id}
              className="!text-xl transition-opacity hover:opacity-90"
              classNameIcon="text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {likeCount} likes
          </div>

          <Caption text={transformHashtags(post.captions)} />

          <div className="mt-2 flex flex-wrap">
            {hashtags.map((hashtag, index) => (
              <Hashtag key={index} content={hashtag} />
            ))}
          </div>

          <div className="mt-2">
            <CommentButton
              postId={post.id}
              className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              View all {post.commentCount || 0} comments
            </CommentButton>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PostItem;
