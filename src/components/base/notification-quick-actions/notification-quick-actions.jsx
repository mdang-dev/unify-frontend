'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

const NotificationQuickActions = ({ notification, currentUserId, onActionComplete }) => {
  const queryClient = useQueryClient();



  // Like/Unlike mutation
  const { mutate: toggleLike, isPending: isLikePending } = useMutation({
    mutationFn: async ({ postId, isLiked }) => {
      // Use the existing liked posts API
      const response = await fetch(`/api/liked-posts`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: currentUserId,
          postId: postId 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries([QUERY_KEYS.POSTS]);
      queryClient.invalidateQueries([QUERY_KEYS.POST, variables.postId]);
      queryClient.invalidateQueries([QUERY_KEYS.NOTIFICATIONS, currentUserId]);
      
      if (onActionComplete) {
        onActionComplete('like', data);
      }
    },
    onError: (error) => {
      console.error('Like action failed:', error);
    },
  });

  // Extract post ID from notification link
  const getPostIdFromLink = (link) => {
    if (!link) return null;
    const match = link.match(/\/posts\/([^\/]+)/);
    return match ? match[1] : null;
  };

  // Check if current user has liked the post (for like notifications)
  const postId = getPostIdFromLink(notification.link);
  const isLiked = postId ? false : false; // This would need to be fetched from post data

  const handleLikeClick = () => {
    if (!postId) return;
    
    toggleLike({
      postId: postId,
      isLiked: isLiked,
    });
  };

  // Only show actions for relevant notification types
  if (!['like'].includes(notification.type?.toLowerCase())) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 mt-2">
      {notification.type?.toLowerCase() === 'like' && postId && (
        <button
          onClick={handleLikeClick}
          disabled={isLikePending}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            isLiked
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLikePending ? (
            <i className="fa-solid fa-spinner fa-spin mr-1"></i>
          ) : (
            <i className={`fa-solid fa-heart mr-1 ${isLiked ? 'text-white' : ''}`}></i>
          )}
          {isLikePending ? 'Liking...' : isLiked ? 'Liked' : 'Like'}
        </button>
      )}

      {/* View Post button for like/comment notifications */}
      {['like', 'comment'].includes(notification.type?.toLowerCase()) && notification.link && (
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && notification.link) {
              window.location.href = notification.link;
            }
          }}
          className="px-3 py-1 text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <i className="fa-solid fa-eye mr-1"></i>
          View Post
        </button>
      )}
    </div>
  );
};

export default NotificationQuickActions; 