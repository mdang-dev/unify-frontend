'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@heroui/react';
import PostDetailModal from '@/src/components/base/post-detail-modal';
import PostGrid from '@/src/components/base/post-grid';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { useState, useCallback } from 'react';

const Hashtag = () => {
  const t = useTranslations('Explore.Hashtag');
  const { hashtag } = useParams();
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: posts, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_HASHTAG, hashtag],
    queryFn: () => postsQueryApi.getPostsByHashtag(hashtag),
    enabled: !!hashtag,
  });

  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="mb-4 w-full text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t('Title', { hashtag })}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{t('Loading')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5">
          {Array(15).fill().map((_, index) => (
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

  if (error) {
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

  if (!posts || posts.length === 0) {
    return (
      <div className="mt-8 flex h-auto w-full flex-wrap justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t('Title', { hashtag })}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('NoPosts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 mt-8 flex h-auto w-full flex-wrap justify-center">
      <div className="mb-4 w-full text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t('Title', { hashtag })}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {posts.length} {t('PostsFound') || 'posts found'}
        </p>
      </div>
      
      <PostGrid 
        posts={posts} 
        onPostClick={handlePostClick}
      />

      {selectedPost && (
        <PostDetailModal 
          post={selectedPost} 
          onClose={closeModal}
          onArchive={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
};

export default Hashtag;
