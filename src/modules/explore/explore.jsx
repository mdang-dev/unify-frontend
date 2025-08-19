'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@heroui/react';
import PostDetailModal from '@/src/components/base/post-detail-modal';
import PostGrid from '@/src/components/base/post-grid';
import LoadingIndicator from '@/src/components/base/loading-indicator';
import { useExplorePosts } from '@/src/hooks/use-explore-posts';

export default function Explore() {
  const t = useTranslations('Explore');
  const [selectedPost, setSelectedPost] = useState(null);
  
  const {
    posts,
    totalPosts,
    hasPosts,
    status,
    isInitialLoading,
    showLoading,
    hasError,
    error,
    hasNextPage,
    canLoadMore,
    fetchNextPage,
    ref,
    shouldFetchNext,
  } = useExplorePosts(12);

  // Auto-fetch next page when user scrolls to bottom
  useEffect(() => {
    if (shouldFetchNext) {
      fetchNextPage();
    }
  }, [shouldFetchNext, fetchNextPage]);

  // Handler for when a post is clicked
  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
  }, []);

  // Handler to close the modal
  const closeModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="mb-4 w-full text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('Loading')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5">
          {Array(15)
            .fill()
            .map((_, index) => (
              <div
                key={index}
                className="h-[200px] w-full sm:h-[220px] md:h-[240px] lg:h-[250px] overflow-hidden rounded-lg shadow-lg"
              >
                <Skeleton className="h-full w-full dark:opacity-10 rounded-lg" />
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Show error message if fetching fails
  if (hasError) {
    return (
      <div className="text-center mt-8">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-semibold">{t('Error')}</h3>
          <p>{error?.message || 'Something went wrong'}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show no posts message if no posts found
  if (!hasPosts) {
    return (
      <div className="mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('NoPosts')}</p>
        </div>
      </div>
    );
  }

  // Render posts with infinite scroll and the modal for the selected post
  return (
    <div className="mb-5 mt-8 flex h-auto w-full flex-wrap justify-center">
      <div className="mb-4 w-full text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t('RecommendedPosts')}
        </h2>
      </div>
      
      {/* Optimized PostGrid component */}
      <PostGrid 
        posts={posts} 
        onPostClick={handlePostClick}
      />

      {/* Infinite scroll trigger */}
      <div ref={ref} className="flex items-center justify-center py-4 w-full">
        <LoadingIndicator 
          isLoading={showLoading}
          text="Loading more posts..."
          size="default"
        />
        
        {!showLoading && canLoadMore && (
          <button
            onClick={() => fetchNextPage()}
            className="font-medium text-blue-500 transition-colors hover:text-blue-600 px-4 py-2 rounded-md border border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Load More Posts
          </button>
        )}
        
        {!showLoading && !canLoadMore && (
          <span className="text-gray-500 dark:text-gray-400">
            {hasPosts ? 'No more posts to load' : 'No posts found'}
          </span>
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && <PostDetailModal post={selectedPost} onClose={closeModal} />}
    </div>
  );
}
