'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VideoPostSkeleton } from '@/src/components/base';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

export default function Reels() {
  const router = useRouter();
  const pathname = usePathname();
  const currentId = pathname.split('/reels/')[1];

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.05,
    triggerOnce: false,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isLoading } =
    useInfiniteQuery({
      queryKey: [QUERY_KEYS.REELS],
      queryFn: ({ pageParam = 0, pageSize = 13 }) =>
        postsQueryApi.getReelsFromPosts(pageParam, pageSize),
      getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage : undefined),
      keepPreviousData: true,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const firstPost = data?.pages[0]?.posts?.[0];
    if (!currentId && firstPost) {
      router.replace(`/reels/${firstPost.id}`);
    }
  }, [data, currentId, router]);

  if (isLoading || status === 'pending') {
    return (
      <div className="h-screen snap-y snap-mandatory flex-col items-center overflow-y-scroll scrollbar-hide">
        <VideoPostSkeleton />
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="flex h-screen snap-y snap-mandatory flex-col items-center overflow-y-scroll scrollbar-hide">
      {allPosts.length > 0 ? (
        allPosts.map((post, index) => (
          <div
            key={post.id}
            id={post.id}
            className="my-4 w-full max-w-md snap-start"
            ref={index === allPosts.length - 1 ? loadMoreRef : null}
          >
            <video className="hidden w-full">
              <source src={post.media[0].url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ))
      ) : (
        <p className="mt-4 text-center">No reels found</p>
      )}

      {isFetchingNextPage && <div className="py-4 text-center">Loading more...</div>}
    </div>
  );
}
