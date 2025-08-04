'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ReportModal, CommentItem, CommentInput, Skeleton } from '@/src/components/base';
import { addToast, ToastProvider } from '@heroui/toast';
import Avatar from '@/public/images/unify_icon_2.svg';
import iconVideo from '@/public/vds.svg';
import iconImage from '@/public/imgs.svg';
import { useAuthStore } from '@/src/stores/auth.store';
import { useCreateReport } from '@/src/hooks/use-report';
import { useBookmarks } from '@/src/hooks/use-bookmark';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { commentsQueryApi } from '@/src/apis/comments/query/comments.query.api';
import NavButton from './nav-button';

const SavedPostDetailModal = ({ post, onClose, onDelete }) => {
  const [openList, setOpenList] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { bookmarks = [], toggleBookmark } = useBookmarks();
  const [selectedMedia, setSelectedMedia] = useState(post?.media?.[0] || null);
  const [replyingTo, setReplyingTo] = useState(null);
  const commentsContainerRef = useRef(null);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id;
  const { mutate: createReport } = useCreateReport();

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS_BY_POST, post.id],
    queryFn: () => commentsQueryApi.getCommentsByPostId(post?.id),
    enabled: !!post?.id,
  });

  // Xử lý report bài post
const handleReportPost = useCallback(
  (postId, reason) => {
    createReport(
      { endpoint: 'post', reportedId: postId, reason },
      {
        onSuccess: () => {
          addToast({
            title: 'Success',
            description: 'Report post successful.',
            timeout: 3000,
            color: 'success',
          });
        },
        onError: (error) => {
          let errorMessage = 'Unknown error';
          let errorColor = 'danger';

          if (error.response) {
            const { status, data } = error.response;
            errorMessage = data?.detail || error.message || 'Unknown error';

            if (
              (status === 400 || status === 409) &&
              (errorMessage === 'You cannot report your own content.' ||
                errorMessage === 'You have already reported this content.')
            ) {
              errorColor = 'warning';
              console.warn('Report warning:', errorMessage);
            } else {
              errorColor = 'danger'; 
              console.error('Report error:', error); 
            }
          } else {
            errorMessage = 'Failed to connect to the server.';
            console.error('Report error:', error); 
          }

          addToast({
            title: 'Fail to report post',
            description: errorMessage,
            timeout: 3000,
            color: errorColor,
          });
        },
        onSettled: () => setIsModalOpen(false),
      }
    );
  },
  [createReport]
);

  // Biến đổi hashtag thành link
  const transformHashtags = (text) => {
    return text.split(/(\#[a-zA-Z0-9_]+)/g).map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Link
            key={index}
            href={`/explore/${part.substring(1)}`}
            className="text-blue-500 hover:underline"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const updateComments = useCallback(
    (newComment) => {
      if (!comments) return;

      const updateRepliesRecursively = (comments) =>
        comments.map((comment) => {
          if (comment.id === newComment.parentId) {
            return {
              ...comment,
              replies: [
                { ...newComment, username: user?.username || 'Unknown' },
                ...(comment.replies || []),
              ],
            };
          }
          if (comment.replies?.length) {
            return {
              ...comment,
              replies: updateRepliesRecursively(comment.replies),
            };
          }
          return comment;
        });

      const updatedComments = newComment.parentId
        ? updateRepliesRecursively(comments)
        : [{ ...newComment, username: user?.username || 'Unknown' }, ...comments];

      commentsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setReplyingTo(null);
      // Optionally update cache using queryClient.setQueryData if persistence is needed
    },
    [comments, user]
  );

  const handleReplyClick = useCallback((comment) => {
    setReplyingTo(comment);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Mở/đóng modal report
  const openReportModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Đóng modal chính
  const handleClose = () => {
    setOpenList(false);
    setIsModalOpen(false);
    onClose();
  };

  // Skeleton loading cho bình luận
  const CommentSkeleton = () => (
    <div className="items-start">
      <div className="mb-14 flex space-x-2">
        <Skeleton variant="circle" width={32} height={32} />
        <div className="flex-1">
          <Skeleton width={96} height={12} rounded />
          <Skeleton width="75%" height={12} rounded className="mt-1" />
          <Skeleton width="50%" height={12} rounded className="mt-1" />
        </div>
      </div>
    </div>
  );

  if (!post) return null;

  return (
    <>
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm dark:bg-neutral-700/40">
        <div className="flex h-[640px] w-[900px] flex-row overflow-hidden rounded-xl border-1 border-neutral-700 bg-gray-100 shadow-2xl dark:bg-neutral-900">
          {/* Media */}
          <div className="relative w-1/2 border-r dark:border-neutral-700">
            {selectedMedia ? (
              selectedMedia.mediaType === 'VIDEO' ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-neutral-800">
                  <video
                    src={selectedMedia.url}
                    controls
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-neutral-800">
                  <img
                    src={selectedMedia.url}
                    className="h-full w-full object-contain"
                    alt="Post Media"
                  />
                </div>
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black text-white">
                <p>No images/videos available</p>
              </div>
            )}

            {post.media.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex w-[90%] -translate-x-1/2 transform gap-2 overflow-x-auto rounded-lg bg-black bg-opacity-60 p-2 scrollbar-hide">
                {post.media.map((item, index) => (
                  <div
                    key={index}
                    className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 bg-black ${
                      selectedMedia?.url === item.url ? 'border-blue-500' : 'border-gray-500'
                    } transition-colors hover:border-blue-400`}
                    onClick={() => setSelectedMedia(item)}
                  >
                    {item.mediaType === 'VIDEO' ? (
                      <div className="relative flex h-full w-full items-center justify-center">
                        <video
                          src={item.url}
                          className="max-h-full max-w-full rounded object-contain"
                          muted
                        />
                        <div className="absolute left-1 top-1">
                          <Image src={iconVideo} width={16} height={16} alt="Video" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex h-full w-full items-center justify-center">
                        <img
                          src={item.url}
                          className="max-h-full max-w-full rounded object-contain"
                          alt="Thumbnail"
                        />
                        <div className="absolute left-1 top-1">
                          <Image src={iconImage} width={16} height={16} alt="Image" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nội dung */}
          <div className="flex w-1/2 flex-col">
            <div className="flex items-center justify-between border-b p-4 dark:border-neutral-800">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full border-2 border-gray-300 dark:border-gray-600">
                  <Image
                    src={post.user?.avatar?.url || Avatar}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <span className="ml-3 font-semibold text-gray-900 dark:text-white">
                  {post.user?.username}
                </span>
              </div>
              <NavButton onClick={() => setOpenList(true)} content="•••" className="text-2xl" />
              {openList && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-80 scale-100 transform rounded-lg bg-white shadow-xl transition-all duration-200 hover:scale-105 dark:bg-neutral-800">
                    <button
                      onClick={() => {
                        openReportModal();
                        setOpenList(false);
                      }}
                      className="w-full rounded-t-lg py-3 font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                      Report
                    </button>
                    <button
                      onClick={() => {
                        toggleBookmark(post.id);
                        setOpenList(false);
                        onClose();
                      }}
                      className="w-full py-3 font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700"
                    >
                      Delete bookmark
                    </button>
                    <button className="w-full py-3 font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-700">
                      Share
                    </button>
                    <button
                      onClick={() => setOpenList(false)}
                      className="w-full rounded-b-lg py-3 font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
              <ReportModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleReportPost}
                postId={post.id}
              />
            </div>

            <div
              className="no-scrollbar flex-1 overflow-y-auto px-4 py-3"
              ref={commentsContainerRef}
            >
              {post.captions === null ? (
                ''
              ) : (
                <div className="flex items-center gap-3 leading-tight text-gray-800 dark:text-gray-200">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600">
                    <Image
                      src={post.user?.avatar?.url || Avatar}
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="mr-4 text-sm font-bold">{post.user?.username}</span>
                  <div className="ml-3 text-sm">{transformHashtags(post.captions)}</div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {isCommentsLoading ? (
                  [...Array(6)].map((_, index) => <CommentSkeleton key={index} />)
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      onReplySubmit={updateComments}
                      onReplyClick={handleReplyClick}
                    />
                  ))
                ) : (
                  <p className="text-xl font-bold text-zinc-500">No comments yet</p>
                )}
              </div>
            </div>

            <div className="border-t p-4 dark:border-neutral-800">
              <CommentInput
                postId={post.id}
                setComments={updateComments}
                parentComment={replyingTo}
                onCancelReply={handleCancelReply}
              />
            </div>
          </div>

          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-3xl font-bold text-gray-200 transition-colors hover:text-white dark:text-neutral-600"
            onClick={handleClose}
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
};

export default SavedPostDetailModal;
