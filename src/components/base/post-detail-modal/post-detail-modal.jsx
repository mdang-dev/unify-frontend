'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CommentItem, CommentInput } from '..';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Avatar from '@/public/images/unify_icon_2.png';
import DeletePostModal from './_components/delete-post-modal';
import ArchivePostModal from './_components/archive-post-modal';
import RestorePostModal from './_components/restore-post-modal';
import Slider from '../slider';
import { useAuthStore } from '@/src/stores/auth.store';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { commentsQueryApi } from '@/src/apis/comments/query/comments.query.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Bookmark from '@/src/components/base/bookmark';
import { Tooltip } from '@heroui/react';
import { useRouter, usePathname } from 'next/navigation';
import ReportModal from '../report-modal';
import { useCreateReport } from '@/src/hooks/use-report';
import { toast } from 'sonner';
const PostDetailModal = ({ post, postId, onClose, onArchive, onDelete, scrollToCommentId }) => {
  const t = useTranslations('Home.PostItem.PostDetailModal');
  const [openList, setOpenList] = useState(false); // no longer used for dropdown; retained to avoid breaking
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(post?.media || []);
  const [replyingTo, setReplyingTo] = useState(null);
  const [fetchedPost, setFetchedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = Cookies.get('token');
  const commentsContainerRef = useRef(null);
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const isOwner = user?.id === post?.user.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { mutate: createReport } = useCreateReport();

  // Nếu chỉ có postId, fetch post detail
  useEffect(() => {
    if (!post && postId) {
      setLoading(true);
      postsQueryApi
        .getPostsById(postId)
        .then((data) => {
          setFetchedPost(data);
          setSelectedMedia(data?.media || []);
        })
        .finally(() => setLoading(false));
    }
  }, [post, postId]);

  const postData = post || fetchedPost;

  const { data: myPost, isLoading: isPostLoading } = useQuery({
    queryKey: [QUERY_KEYS.POST_DETAIL, postData?.id],
    queryFn: () => postsQueryApi.getPostsById(postData?.id),
    enabled: !!postData?.id,
  });

  // (moved below comments query to avoid TDZ)

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

  // Tải bình luận
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS_BY_POST, postData?.id],
    queryFn: () => commentsQueryApi.getCommentsByPostId(postData.id),
    enabled: !!postData?.id,
  });

  // ✅ Scroll to specific comment once comments are available
  useEffect(() => {
    if (!scrollToCommentId) return;
    if (!commentsContainerRef.current) return;
    if (!Array.isArray(comments) || comments.length === 0) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[PostDetailModal] Scrolling to comment:', scrollToCommentId, 'Total comments:', comments.length);
      console.log('[PostDetailModal] Comments data:', comments.map(c => ({ id: c.id, content: c.content?.substring(0, 50) })));
    }

    const timer = window.setTimeout(() => {
      const selector = `[data-comment-id="${scrollToCommentId}"]`;
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostDetailModal] Looking for selector:', selector);
        console.log('[PostDetailModal] All comment elements:', document.querySelectorAll('[data-comment-id]'));
      }
      
      const commentElement = document.querySelector(selector);
      if (commentElement) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostDetailModal] Found comment element, scrolling...', commentElement);
        }
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Force highlight with multiple approaches
        commentElement.style.backgroundColor = 'rgba(107, 114, 128, 0.6)';
        commentElement.style.padding = '12px';
        commentElement.style.margin = '-12px';
        commentElement.style.transform = 'scale(1.02)';
        commentElement.style.boxShadow = '0 0 20px rgba(107, 114, 128, 0.3)';
        
        // Also add CSS class
        commentElement.classList.add('flash-highlight');
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostDetailModal] Highlight classes added:', commentElement.className);
          console.log('[PostDetailModal] Inline styles applied:', commentElement.style.cssText);
        }
        
        window.setTimeout(() => {
          commentElement.style.backgroundColor = '';
          commentElement.style.padding = '';
          commentElement.style.margin = '';
          commentElement.style.transform = '';
          commentElement.style.boxShadow = '';
          commentElement.classList.remove('flash-highlight');
        }, 2000);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PostDetailModal] Comment element not found for ID:', scrollToCommentId);
          console.warn('[PostDetailModal] Available comment IDs:', Array.from(document.querySelectorAll('[data-comment-id]')).map(el => el.getAttribute('data-comment-id')));
        }
      }
    }, 500); // Increased delay

    return () => window.clearTimeout(timer);
  }, [scrollToCommentId, comments]);

  // ✅ Fallback: Scroll when post data finally loads
  useEffect(() => {
    if (!scrollToCommentId || !postData) return;
    if (!Array.isArray(comments) || comments.length === 0) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[PostDetailModal] Post data loaded, attempting fallback scroll to comment:', scrollToCommentId);
    }

    // Wait a bit more for DOM to fully render
    const fallbackTimer = window.setTimeout(() => {
      const selector = `[data-comment-id="${scrollToCommentId}"]`;
      const commentElement = document.querySelector(selector);
      if (commentElement) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostDetailModal] Fallback scroll successful');
        }
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Force highlight with inline styles
        commentElement.style.backgroundColor = 'rgba(107, 114, 128, 0.6)';
        commentElement.style.padding = '12px';
        commentElement.style.margin = '-12px';
        commentElement.style.transform = 'scale(1.02)';
        commentElement.style.boxShadow = '0 0 20px rgba(107, 114, 128, 0.3)';
        
        commentElement.classList.add('flash-highlight');
        window.setTimeout(() => {
          commentElement.style.backgroundColor = '';
          commentElement.style.padding = '';
          commentElement.style.margin = '';
          commentElement.style.transform = '';
          commentElement.style.boxShadow = '';
          commentElement.classList.remove('flash-highlight');
        }, 2000);
      }
    }, 1000); // Increased delay

    return () => window.clearTimeout(fallbackTimer);
  }, [scrollToCommentId, postData, comments]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Cập nhật danh sách bình luận (tương tự updateComments trong Reels)
  const updateComments = useCallback(
    (newComment) => {
      queryClient.setQueryData(['comments', post?.id], (prevComments = []) => {
        const currentComments = Array.isArray(prevComments) ? prevComments : [];

        const updateRepliesRecursively = (comments) =>
          comments.map((comment) => {
            if (comment.id === newComment.parentId) {
              return {
                ...comment,
                replies: [
                  {
                    ...newComment,
                    username: user?.username || 'Unknown',
                    avatarUrl: user?.avatar?.url || Avatar.src,
                  },
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
          ? updateRepliesRecursively(currentComments)
          : [
              {
                ...newComment,
                username: user?.username || 'Unknown',
                avatarUrl: user?.avatar?.url || Avatar.src,
              },
              ...currentComments,
            ];

        return updatedComments;
      });

      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }

      setReplyingTo(null);
    },
    [post?.id, queryClient, user]
  );

  // Xử lý khi nhấn Reply
  const handleReplyClick = useCallback((comment) => {
    setReplyingTo(comment);
  }, []);

  // Hủy trả lời
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleOpenDeleteModal = () => setShowDeleteModal(true);
  const handleOpenArchiveModal = () => setShowArchiveModal(true);
  const handleOpenRestoreModal = () => setShowRestoreModal(true);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Unify Post', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (_) {}
  };

  const handleReportSubmit = (postId, reason) => {
    createReport(
      { endpoint: 'post', reportedId: postId, reason },
      {
        onSuccess: () => {
          toast.success(t('ReportModal.Success.ReportSubmitted'));
          setIsReportOpen(false);
        },
        onError: (error) => {
          const errorMessage = error?.message || 'Unknown error';
          if (errorMessage === 'You have reported this content before.') {
            toast.warning(t('ReportModal.Success.AlreadyReported'));
          } else {
            toast.error(t('ReportModal.Error.FailedToReport') + ': ' + errorMessage);
          }
          setIsReportOpen(false);
        },
      }
    );
  };

  const handleClose = () => {
    setOpenList(false);
    setShowDeleteModal(false);
    onClose();
  };

  // Skeleton loading cho bình luận
  const PostSkeleton = () => (
    <div className="animate-pulse">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
        <div className="flex-1">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-neutral-700" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-700" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-neutral-700" />
      </div>
    </div>
  );

  const CommentSkeleton = () => (
    <div className="mb-4 flex animate-pulse items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-700" />
      <div className="flex-1">
        <div className="mb-2 h-3 w-20 rounded bg-gray-200 dark:bg-neutral-700" />
        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-neutral-700" />
      </div>
    </div>
  );

  if (!postData) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
        <div
          className="flex h-[600px] w-[900px] flex-row overflow-hidden rounded-xl bg-white dark:bg-neutral-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left placeholder */}
          <div className="relative w-1/2 bg-black/70" />

          {/* Right skeleton content */}
          <div className="flex w-1/2 flex-col p-4">
            <PostSkeleton />
            <div className="mt-6 space-y-3">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-3 w-full rounded bg-gray-200 dark:bg-neutral-800" />)
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-2xl font-bold text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex h-[600px] w-[900px] flex-row overflow-hidden rounded-xl bg-white dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
        {/* Media Section */}
        <div className="relative w-1/2 bg-black">
          <Slider srcs={postData.media || []} onImageClick={() => {}} />
          {/* {selectedMedia ? (
            selectedMedia.mediaType === "VIDEO" ? (
              <video
                src={selectedMedia.url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt="Post Media"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>No media available</p>
            </div>
          )} */}
        </div>

        {/* Content Section */}
        <div className="flex w-1/2 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600">
                <Image
                  src={postData.user?.avatar?.url || Avatar}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {postData.user?.username}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bookmark
                postId={postData.id}
                className="!text-xl transition-opacity hover:opacity-90"
                classNameIcon="text-gray-900 dark:text-gray-100"
              />
              {/* Top action icons */}
              {isOwner ? (
                <>
                  <Tooltip content="Delete" placement="bottom">
                    <button onClick={handleOpenDeleteModal} className="p-2 text-red-500 hover:opacity-80">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </Tooltip>
                  <Tooltip content="Update" placement="bottom">
                    <button onClick={() => router.push(`/posts/${postData.id}`)} className="p-2 hover:opacity-80">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </Tooltip>
                  {pathname?.includes('/archive') ? (
                    <Tooltip content="Restore" placement="bottom">
                      <button onClick={handleOpenRestoreModal} className="p-2 hover:opacity-80">
                        <i className="fa-solid fa-rotate-left"></i>
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Move to Archive" placement="bottom">
                      <button onClick={handleOpenArchiveModal} className="p-2 hover:opacity-80">
                        <i className="fa-solid fa-box-archive"></i>
                      </button>
                    </Tooltip>
                  )}
                </>
              ) : (
                <Tooltip content="Report" placement="bottom">
                  <button onClick={() => setIsReportOpen(true)} className="p-2 text-red-500 hover:opacity-80">
                    <i className="fa-solid fa-flag"></i>
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Share" placement="bottom">
                <button onClick={handleShare} className="p-2 hover:opacity-80">
                  <i className="fa-solid fa-share-nodes"></i>
                </button>
              </Tooltip>
            </div>

            <DeletePostModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={() => {
                onDelete(postData.id);
                setShowDeleteModal(false);
              }}
            />
            <ArchivePostModal
              isOpen={showArchiveModal}
              onClose={() => setShowArchiveModal(false)}
              onConfirm={() => {
                onArchive(postData.id);
                setShowArchiveModal(false);
              }}
            />
            <RestorePostModal
              isOpen={showRestoreModal}
              onClose={() => setShowRestoreModal(false)}
              onConfirm={() => {
                onArchive(postData.id);
                setShowRestoreModal(false);
              }}
            />
            {isReportOpen && (
              <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                onSubmit={handleReportSubmit}
                postId={postData.id}
              />
            )}
          </div>

          {/* Comments Section */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Caption */}
            {postData.captions && (
              <div className="flex-shrink-0 border-b p-4 dark:border-neutral-800">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600">
                    <Image
                      src={postData.user?.avatar?.url || Avatar}
                      width={32}
                      height={32}
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {postData.user?.username}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(postData.postedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
                      {transformHashtags(postData.captions)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div
              className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3"
              ref={commentsContainerRef}
            >
              {isCommentsLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, index) => (
                    <CommentSkeleton key={index} />
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      onReplySubmit={updateComments}
                      onReplyClick={handleReplyClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="font-medium text-zinc-500 dark:text-zinc-400">{t('NoCommentsYet')}</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex-shrink-0 border-t p-4 dark:border-neutral-800">
              <CommentInput
                postId={postData.id}
                setComments={updateComments}
                parentComment={replyingTo}
                onCancelReply={handleCancelReply}
              />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-2xl font-bold text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default React.memo(PostDetailModal);
