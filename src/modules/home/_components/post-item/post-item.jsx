'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import LikeButton from '@/src/components/button/like-button';
import CommentButton from '@/src/components/base/comment-button';
import ShareButton from '@/src/components/button/share-button';
import Bookmark from '@/src/components/base/bookmark';
import Slider from '@/src/components/base/slider';
import { usePostLikeStatus } from '@/src/hooks/use-post-like-status';
import { toast } from 'sonner';
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
  const t = useTranslations('Home.PostItem');
  const { user } = useAuthStore();
  const { likeCount, setLikeCount } = usePostLikeStatus(user?.id, post?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const { mutate: reportPost } = useMutation({
  mutationFn: ({ endpoint, reportedId, reason, urls = [] }) =>
    reportsCommandApi.createReport(endpoint, reportedId, reason, urls),
  onSuccess: (data) => {
    if (data?.error) {
      const errorMessage = data.error;

      if (
        errorMessage === 'You cannot report your own content.' ||
        errorMessage === 'You have already reported this content.'
      ) {
        toast.warning(errorMessage);
        console.warn('Report warning:', errorMessage);
      } else {
        toast.error(errorMessage);
        console.error('Report error:', errorMessage);
      }
    } else {
      toast.success(t('Report.ReportPostSuccessful'));
    }

    setIsModalOpen(false);
  },
  onError: (error) => {
    let errorMessage = t('Report.FailedToConnectServer');

    if (error.response) {
      const { status, data } = error.response;
      errorMessage = data?.detail || error.message || t('Report.UnknownError');

      if (
        (status === 400 || status === 409) &&
        (errorMessage === 'You cannot report your own content.' ||
          errorMessage === 'You have already reported this content.')
      ) {
        toast.warning(errorMessage);
        console.warn('Report warning:', errorMessage);
      } else {
        toast.error(errorMessage);
        console.error('Report error:', error);
      }
    } else {
      toast.error(errorMessage);
      console.error('Report error:', error);
    }

    setIsModalOpen(false);
  },
});


const handleReportPost = useCallback(
  async (postId, reason, urls = []) => {
    reportPost({
      endpoint: 'post',
      reportedId: postId, 
      reason,
      urls 
    });
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
        className="w-full overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg dark:bg-neutral-800"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-700">
          <User user={post.user} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-red-400"
              title={t('Actions.Report')}
            >
              <i className="fa-solid fa-flag text-sm"></i>
            </button>
            <button
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
              title="Not interested"
            >
              <i className="fa-solid fa-eye-slash text-sm"></i>
            </button>
          </div>
        </div>



        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleReportPost}
          postId={post.id}
        />

        <div className="w-full bg-white dark:bg-neutral-800">
          <div className="relative overflow-hidden">
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
              <ShareButton className="!text-xl transition-opacity hover:opacity-50" post={post} />
            </div>
            <Bookmark
              postId={post.id}
              className="!text-xl transition-opacity hover:opacity-90"
              classNameIcon="text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {likeCount} {t('Actions.Likes')}
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
              {t('Actions.ViewAll')} {post.commentCount || 0} {t('Actions.Comments')}
            </CommentButton>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PostItem;
