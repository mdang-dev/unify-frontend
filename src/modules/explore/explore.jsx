'use client';

import { useState, useCallback } from 'react';
import PostCard from '@/src/components/base/post-card';
import { Skeleton } from '@heroui/react';
import PostDetailModal from '@/src/components/base/post-detail-modal';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { useQuery } from '@tanstack/react-query';

export default function Explore() {
  const [selectedPost, setSelectedPost] = useState(null);

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.RECOMMENDED_POSTS],
    queryFn: postsQueryApi.getRecommendedPosts,
  });

  // Handler for when a post is clicked
  const handlePostClick = useCallback((post) => {
    setSelectedPost(post); // Set the clicked post as selected
  }, []);

  // Handler to close the modal
  const closeModal = useCallback(() => {
    setSelectedPost(null); // Clear the selected post
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array(8)
            .fill()
            .map((_, index) => (
              <div
                key={index}
                className="h-[300px] w-full max-w-[300px] overflow-hidden rounded-lg"
              >
                <Skeleton className="h-[300px] w-[300px] dark:opacity-10" />
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Show error message if fetching fails
  if (error) return <div>Error: {error.message}</div>;

  // Render posts and the modal for the selected post
  return (
    <div className="mb-5 mt-8 flex h-auto w-full flex-wrap justify-center">
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => (
          <div key={post.id} className="h-[300px] w-[300px] overflow-hidden rounded-lg">
            <PostCard post={post} onClick={() => handlePostClick(post)} postId={post.id} />
          </div>
        ))}
      </div>
      {selectedPost && <PostDetailModal post={selectedPost} onClose={closeModal} />}
    </div>
  );
}
