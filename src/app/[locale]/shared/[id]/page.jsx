'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/stores/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { commentsQueryApi } from '@/src/apis/comments/query/comments.query.api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import Slider from '@/src/components/base/slider';
import { CommentItem, CommentInput } from '@/src/components/base';
import Avatar from '@/public/images/unify_icon_2.png';
import { Bookmark } from '@/src/components/base';
import LikeButton from '@/src/components/button/like-button';
import { getCookie } from '@/src/utils/cookies.util';
import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';

const SharedPostPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const postId = params.id;
  const commentsContainerRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Check for token directly
  const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
  const hasToken = !!token;

  // Debug authentication state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state:', { hasToken, isAuthenticated, user: user?.username, postId });
    }
  }, [hasToken, isAuthenticated, user, postId]);

  // Fetch post details - only if user has token
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['shared-post', postId],
    queryFn: () => postsQueryApi.getPostDetails(postId),
    enabled: !!postId && hasToken,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching post:', err);
    },
  });

  // Fetch comments - only if user has token
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS_BY_POST, postId],
    queryFn: () => commentsQueryApi.getCommentsByPostId(postId),
    enabled: !!postId && !!post && hasToken,
  });

  const currentUserId = user?.id;
  const queryClient = useQueryClient();

  const handleClose = () => {
    router.push('/');
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

      // Update the query cache
      queryClient.setQueryData([QUERY_KEYS.COMMENTS_BY_POST, postId], updatedComments);
    },
    [comments, user?.username, postId, queryClient]
  );

  const handleReplyClick = useCallback((comment) => {
    setReplyingTo(comment);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const transformHashtags = (text) => {
    if (!text) return '';
    return text.replace(/#([a-zA-Z0-9_]+)/g, (match, hashtag) => {
      return `<span class="text-blue-500 cursor-pointer hover:underline">${match}</span>`;
    });
  };

  // Show login prompt for unauthenticated users
  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-4"
        >
          <div className="mb-6">
            <i className="fa-solid fa-lock text-5xl text-blue-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view this post
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            This shared post requires authentication. Please sign in to your Unify account to view the full content.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              Create Account
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm"
            >
              Go to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Loading post...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-4">
            <i className="fa-solid fa-exclamation-triangle text-4xl text-red-400"></i>
          </div>
          <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Post Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-lg"></i>
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Shared Post</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Post Media */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
            <div className="relative bg-black">
              <Slider srcs={post.media || []} onImageClick={() => {}} />
            </div>
          </div>

          {/* Right Side - Post Info and Comments */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg flex flex-col h-[600px]">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600">
                  <Image
                    src={post.user?.avatar?.url || Avatar}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Link 
                    href={`/profile/${post.user?.username}`}
                    className="font-semibold text-gray-900 dark:text-white hover:underline"
                  >
                    {post.user?.username}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fa-solid fa-ellipsis text-lg"></i>
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Caption */}
              {post.captions && (
                <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0">
                      <Image
                        src={post.user?.avatar?.url || Avatar}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 dark:text-white mr-2">
                        {post.user?.username}
                      </span>
                      <span 
                        className="text-gray-800 dark:text-gray-200"
                        dangerouslySetInnerHTML={{ __html: transformHashtags(post.captions) }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <LikeButton
                      userId={user?.id}
                      postId={post.id}
                      className="!text-xl transition-opacity hover:opacity-50"
                      classText="hidden"
                    />
                    <button className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
                      <i className="fa-regular fa-comment text-xl"></i>
                    </button>
                    <button className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
                      <i className="fa-solid fa-share text-xl"></i>
                    </button>
                  </div>
                  <Bookmark
                    postId={post.id}
                    className="!text-xl transition-opacity hover:opacity-90"
                    classNameIcon="text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                {/* Like count */}
                {post.likeCount > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto" ref={commentsContainerRef}>
                {isCommentsLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="flex animate-pulse items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-700" />
                        <div className="flex-1">
                          <div className="mb-2 h-3 w-20 rounded bg-gray-200 dark:bg-neutral-700" />
                          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-neutral-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length > 0 ? (
                  <div className="p-4 space-y-4">
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
                  <div className="flex h-full items-center justify-center p-4">
                    <p className="font-medium text-zinc-500 dark:text-zinc-400">No comments yet</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-700 p-4">
                <CommentInput
                  postId={post.id}
                  setComments={updateComments}
                  parentComment={replyingTo}
                  onCancelReply={handleCancelReply}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedPostPage;
