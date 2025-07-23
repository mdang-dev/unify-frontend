'use client';

import React, { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import PostItem from './post-item/post-item';
import { useInView } from 'react-intersection-observer';
import PostLoading from './post-loading';
import { useDebounce } from '@/src/hooks/use-debounce-lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

const Post = () => {
  const { ref, inView } = useInView({ threshold: 0.3 });
  const [isLoading, setIsLoading] = useState(true);

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, status, error } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.POSTS],
    queryFn: ({ pageParam = 0, pageSize = 3 }) => postsQueryApi.getPosts(pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    keepPreviousData: true,
  });

  // Log error for debugging
  useEffect(() => {
    if (error) {
      console.error('Posts query error:', error);
    }
  }, [error]);

  const showLoading = useDebounce(isFetchingNextPage, 50);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (status === 'success') {
      setIsLoading(false);
    }
  }, [status]);

  if (status === 'pending' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PostLoading />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Unable to load posts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.response?.status === 401 
              ? 'Please log in to view posts' 
              : 'Something went wrong. Please try again later.'
            }
          </p>
          {error?.response?.status === 401 && (
            <a 
              href="/login" 
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[590px] px-4 py-4">
      <AnimatePresence mode="wait">
        {data?.pages.map((page, pageIndex) => (
          <motion.div
            key={page.id || page.nextPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: pageIndex * 0.1 }}
          >
            {page.posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="mb-4"
              >
                <PostItem post={post} />
              </motion.div>
            ))}
          </motion.div>
        ))}
      </AnimatePresence>

      <div ref={ref} className="flex items-center justify-center py-4">
        {showLoading ? (
          <PostLoading />
        ) : hasNextPage ? (
          <button
            onClick={() => fetchNextPage()}
            className="font-medium text-blue-500 transition-colors hover:text-blue-600"
          >
            Load more
          </button>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">No more posts</span>
        )}
      </div>
    </div>
  );
};

export default Post;
