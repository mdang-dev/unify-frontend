'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SavedPostDetailModal from './_components/saved-post-detail-modal';
import { Spinner } from '@heroui/react';
import { useBookmarks } from '@/src/hooks/use-bookmark';

const SavedItems = ({ username }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const { bookmarks = [], loading, refetchBookmarks } = useBookmarks();

  useEffect(() => {
    if (username) {
      refetchBookmarks();
    }
  }, [refetchBookmarks, username]);

  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  return (
    <>
      <div className="mx-auto max-w-3xl">
        {loading ? (
          <div className="flex h-screen items-center justify-center">
            <Spinner color="primary" label="Loading posts..." labelColor="primary" />
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {bookmarks.map((post) => (
              <div
                key={post.post.id}
                className="group relative aspect-square cursor-pointer"
                onClick={() => handlePostClick(post.post)}
              >
                <div className="pointer-events-none absolute left-0 right-0 top-0 bg-black/50 p-1 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="text-sm">
                    {post.savedAt
                      ? (() => {
                          const date = new Date(post.savedAt);
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          const yyyy = date.getFullYear();
                          return `${mm}-${dd}-${yyyy}`;
                        })()
                      : ''}
                  </p>
                </div>
                {post.post.media.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center bg-black">
                    <p className="text-sm text-white">View article</p>
                  </div>
                ) : (
                  <div className="h-full w-full overflow-hidden">
                    {post.post.media[0]?.mediaType === 'VIDEO' ? (
                      <video
                        src={post.post.media[0]?.url}
                        className="h-full w-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={post.post.media[0]?.url}
                        className="h-full w-full object-cover"
                        alt="Post media"
                      />
                    )}
                  </div>
                )}
                {post.post.media.length > 1 && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/50 p-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                      {post.post.media.map((mediaItem, index) => (
                        <div key={index} className="h-12 w-12 flex-shrink-0">
                          {mediaItem?.mediaType === 'VIDEO' ? (
                            <video src={mediaItem?.url} className="h-full w-full object-cover" />
                          ) : (
                            <img
                              src={mediaItem?.url}
                              className="h-full w-full object-cover"
                              alt="Media preview"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {post.post.media.length > 1 && (
                  <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
                    <span>
                      <i className="fa-solid fa-layer-group"></i>
                    </span>
                  </div>
                )}
                {post.post.media[0]?.mediaType === 'VIDEO' && (
                  <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
                    {post.post.media.length > 1 ? (
                      <i className="fa-solid fa-layer-group"></i>
                    ) : (
                      <i className="fa-solid fa-film"></i>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-center text-gray-500">
            <p>No saved posts available.</p>
            <button onClick={refetchBookmarks} className="text-blue-500">
              Try again
            </button>
          </div>
        )}

        {selectedPost && <SavedPostDetailModal post={selectedPost} onClose={closeModal} />}
      </div>
    </>
  );
};

export default SavedItems;
