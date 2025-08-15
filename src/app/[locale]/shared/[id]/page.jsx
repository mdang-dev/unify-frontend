'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { toast } from 'sonner';
import PostDetailModal from '@/src/components/base/post-detail-modal';
import { motion } from 'framer-motion';

const SharedPostPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const postId = params.id;

  // Fetch post details - allow fetching even without authentication for shared posts
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsQueryApi.getPostDetails(postId),
    enabled: !!postId, // Remove authentication requirement for shared posts
  });

  useEffect(() => {
    // Show the post modal when post is loaded, regardless of authentication status
    if (post) {
      setShowModal(true);
    }
  }, [post]);

  const handleCloseModal = () => {
    setShowModal(false);
    // Redirect to home page after closing modal
    router.push('/');
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {showModal && post && (
        <PostDetailModal
          isOpen={showModal}
          onClose={handleCloseModal}
          post={post}
        />
      )}
    </div>
  );
};

export default SharedPostPage;
