'use client';

import React, { memo, useCallback } from 'react';
import PostCard from './post-card';
import { motion, AnimatePresence } from 'framer-motion';

const PostGrid = memo(({ posts, onPostClick, className = "" }) => {
  const handlePostClick = useCallback((post) => {
    if (post && post.id) {
      onPostClick?.(post);
    }
  }, [onPostClick]);

  // Validate posts data
  if (!posts) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>Posts data is missing</p>
        <p className="text-sm mt-2">Please check the API response</p>
      </div>
    );
  }

  if (!Array.isArray(posts)) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>Invalid posts data format</p>
        <p className="text-sm mt-2">Expected array, got: {typeof posts}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No posts available</p>
        <p className="text-sm mt-2">Try refreshing the page</p>
      </div>
    );
  }

  // Filter out invalid posts
  const validPosts = posts.filter(post => {
    if (!post) {
      return false;
    }
    if (!post.id) {
      return false;
    }
    return true;
  });

  if (validPosts.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No valid posts found</p>
        <p className="text-sm mt-2">All posts were invalid or missing IDs</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 ${className}`}>
      <AnimatePresence mode="wait">
        {validPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3, 
              delay: Math.min(index * 0.05, 0.5), // Cap delay for performance
              ease: "easeOut"
            }}
            className="h-[200px] w-full sm:h-[220px] md:h-[240px] lg:h-[250px] overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 dark:shadow-gray-900/50 dark:hover:shadow-gray-800/60"
            layout // Enable layout animations
          >
            <PostCard 
              post={post} 
              onClick={handlePostClick} 
              postId={post.id} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

PostGrid.displayName = 'PostGrid';

export default PostGrid;
