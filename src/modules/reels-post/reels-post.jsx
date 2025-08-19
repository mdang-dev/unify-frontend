'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import ShareReels from './_components/share-reels';
import PostReels from './_components/post-reels';
import { CommentItem, CommentInput, CaptionWithMore } from '@/src/components/base';
import { useDisclosure } from '@heroui/react';
import FollowButton from '@/src/components/button/follow-button';
import LikeButton from '@/src/components/button/like-button';
import { ReportModal } from '@/src/components/base';
import { useCreateReport } from '@/src/hooks/use-report';
import { addToast } from '@heroui/toast';
import Skeleton from '@/src/components/base/skeleton';
import VideoPostSkeleton from '@/src/components/base/video-post-skeleton';
import { Bookmark as BookmarkButton } from '@/src/components/base';
import { useInView } from 'react-intersection-observer';
import { useAuthStore } from '@/src/stores/auth.store';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { commentsQueryApi } from '@/src/apis/comments/query/comments.query.api';
import { toast } from 'sonner';

export default function ReelsPost() {
  const [postStates, setPostStates] = useState({});
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [isMutedGlobally, setIsMutedGlobally] = useState(true);
  const [activePostId, setActivePostId] = useState(null);
  const [selectedAvatars, setSelectedAvatars] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const { postId } = useParams();
  const currentUserId = user?.id;
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const createPostReport = useCreateReport();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.05 });
  const prevVideoPostsRef = useRef([]);

  // Infinite query
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useInfiniteQuery({
      queryKey: [QUERY_KEYS.REELS],
      queryFn: ({ pageParam = 0, pageSize = 13 }) =>
        postsQueryApi.getReelsFromPosts(pageParam, pageSize),
      getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage : undefined),

      keepPreviousData: true,
    });

  // Memoize videoPosts
  const videoPosts = useMemo(() => data?.pages.flatMap((page) => page.posts) || [], [data]);

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS_BY_POST, currentPostId],
    queryFn: () => commentsQueryApi.getCommentsByPostId(currentPostId),
    enabled: !!currentPostId && isCommentOpen,
  });

  const sortCommentsRecursively = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    const safeTime = (d) => {
      const t = new Date(d).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    const sorted = [...items].sort(
      (a, b) =>
        safeTime(b?.commentedAt) - safeTime(a?.commentedAt) ||
        String(b?.id).localeCompare(String(a?.id))
    );
    return sorted.map((c) => ({
      ...c,
      replies:
        Array.isArray(c?.replies) && c.replies.length > 0
          ? sortCommentsRecursively(c.replies)
          : c?.replies || [],
    }));
  }, []);

  const sortedComments = useMemo(
    () => sortCommentsRecursively(comments || []),
    [comments, sortCommentsRecursively]
  );

  const initializePostState = useCallback(
    (posts) =>
      posts.reduce(
        (acc, post) => ({
          ...acc,
          [post.id]: {
            isLiked: false,
            isSaved: false,
            isPopupOpen: false,
            isFollow: false,
            isPaused: false,
            isModalOpen: false,
            comments: [],
          },
        }),
        {}
      ),
    []
  );

  // Initialize post states for new posts
  useEffect(() => {
    if (videoPosts.length > 0 && prevVideoPostsRef.current !== videoPosts) {
      setPostStates((prev) => {
        const newPosts = videoPosts.filter((post) => !Object.keys(prev).includes(post.id));
        if (newPosts.length > 0) {
          return { ...prev, ...initializePostState(newPosts) };
        }
        return prev;
      });
      prevVideoPostsRef.current = videoPosts;
    }
  }, [initializePostState, videoPosts]);

  // Load more data when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Handle navigation and active post
  const hasSetInitialRoute = useRef(false);
  useEffect(() => {
    if (hasSetInitialRoute.current || !videoPosts.length) return;

    if (!postId) {
      setActivePostId(videoPosts[0].id);
      router.replace(`/reels/${videoPosts[0].id}`, undefined, { shallow: true });
    } else {
      setActivePostId(postId);
    }

    hasSetInitialRoute.current = true;
  }, [videoPosts, postId, router]);

  // Pause videos when videoPosts changes
  useEffect(() => {
    if (videoPosts.length === 0) return;

    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
      }
    });
  }, [videoPosts]);

  // IntersectionObserver for auto-playing videos
  useEffect(() => {
    if (videoPosts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const postId = video.dataset.postId;
          const isManuallyPaused = postStates[postId]?.isPaused;

          if (entry.isIntersecting && !isManuallyPaused) {
            video.playbackRate = 1;
            video.muted = isMutedGlobally;
            video.play().catch((err) => console.error('Play error:', err));
            if (activePostId !== postId) {
              setActivePostId(postId);
              window.history.pushState({}, '', `/reels/${postId}`);
            }
          } else {
            video.pause();
            video.muted = true;
          }
        });
      },
      { threshold: 0.7 }
    );

    videoRefs.current.forEach((video, index) => {
      if (video && videoPosts[index]) {
        video.dataset.postId = videoPosts[index].id;
        observer.observe(video);
      }
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [videoPosts, postStates, isMutedGlobally, activePostId]);

  // Handle popstate and scroll
  useEffect(() => {
    const handlePopStateAndScroll = () => {
      const currentPostId = window.location.pathname.split('/').pop();
      const targetPostIndex = videoPosts.findIndex((post) => post.id === currentPostId);
      if (targetPostIndex !== -1 && videoRefs.current[targetPostIndex]) {
        videoRefs.current[targetPostIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    };

    if (postId && videoPosts.length > 0) handlePopStateAndScroll();
    window.addEventListener('popstate', handlePopStateAndScroll);
    return () => window.removeEventListener('popstate', handlePopStateAndScroll);
  }, [postId, videoPosts]);

  const updatePostState = useCallback((postId, updates) => {
    setPostStates((prev) => {
      const newState = { ...prev[postId], ...updates };
      if (JSON.stringify(prev[postId]) !== JSON.stringify(newState)) {
        return { ...prev, [postId]: newState };
      }
      return prev;
    });
  }, []);

  const toggleComment = useCallback(
    (postId) => {
      console.log(`Toggling comment for postId: ${postId}, isCommentOpen: ${!isCommentOpen}`); // Debug toggleComment
      setCurrentPostId(postId);
      setIsCommentOpen((prev) => !prev);
    },
    [isCommentOpen]
  );

  const handlePauseChange = useCallback(
    (postId, isPaused) => {
      updatePostState(postId, { isPaused });
      const video = videoRefs.current.find((v) => v?.dataset.postId === postId);
      if (video) {
        if (isPaused) {
          video.pause();
        } else {
          video.muted = isMutedGlobally;
          video.play().catch((err) => console.error('Play error:', err));
          if (activePostId !== postId) {
            setActivePostId(postId);
          }
        }
      }
    },
    [isMutedGlobally, activePostId]
  );

  const handleMuteChange = useCallback((isMuted) => {
    setIsMutedGlobally(isMuted);
    videoRefs.current.forEach((video) => {
      if (video) video.muted = isMuted;
    });
  }, []);

  const togglePopup = useCallback(
    (postId) => {
      updatePostState(postId, { isPopupOpen: !postStates[postId]?.isPopupOpen });
    },
    [postStates]
  );

  const closeMore = useCallback((e, postId) => {
    if (e.target.id === 'overmore') {
      updatePostState(postId, { isPopupOpen: false });
    }
  }, []);

  const openReportModal = useCallback((postId) => {
    updatePostState(postId, { isModalOpen: true });
  }, []);

  const closeModal = useCallback((postId) => {
    updatePostState(postId, { isModalOpen: false });
  }, []);

  const handleReportPost = useCallback(
    async (postId, reason, urls = []) => {
      createPostReport.mutate(
        { endpoint: 'post', reportedId: postId, reason, urls },
        {
          onSuccess: () => {
            addToast({
              title: 'Success',
              description: 'Report post successful.',
              timeout: 3000,

              color: 'success',
            });
          },
          onError: (err) => {
            addToast({
              title: 'Fail to report post',
              description: err?.response?.data?.message || err?.message,
              timeout: 3000,
              color: 'warning',
            });
          },
        }
      );
      updatePostState(postId, { isModalOpen: false });
    },
    [createPostReport]
  );

  const handleShare = useCallback(() => {
    if (selectedAvatars.length > 0) {
      onOpenChange(false);
    }
  }, [selectedAvatars, onOpenChange]);

  const handleReplySubmit = useCallback(
    (newComment) => {
      updateComments(currentPostId, newComment);
      setReplyingTo(null);
    },
    [currentPostId]
  );

  const handleReplyClick = useCallback((target) => {
    setReplyingTo(target);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const goToProfile = useCallback(
    (username) => {
      if (!username) return;
      router.push(`/others-profile/${username}`);
    },
    [router]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) return;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      toast.success('Link copied', { position: 'bottom-center', duration: 2000 });
    } catch (_) {
      // no-op
    }
  }, []);

  const updateComments = useCallback(
    (postId, newComment) => {
      setPostStates((prev) => {
        const currentComments = Array.isArray(prev[postId]?.comments) ? prev[postId].comments : [];

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
          ? updateRepliesRecursively(currentComments)
          : [{ ...newComment, username: user?.username || 'Unknown' }, ...currentComments];

        return {
          ...prev,
          [postId]: { ...prev[postId], comments: updatedComments },
        };
      });
    },
    [user]
  );

  const CommentSkeleton = () => (
    <div className="items-start">
      <div className="mb-14 flex space-x-2">
        <Skeleton variant="circle" width={32} height={32} />
        <div className="flex-1">
          <Skeleton width={96} height={12} rounded />
          <Skeleton width="75%" height={12} rounded className="mt-1" />
          <Skeleton width="50%" height={12} rounded className="mt-1" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
        {[...Array(1)].map((_, index) => (
          <VideoPostSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error loading reels: {error.message}</div>;
  }

  const lastPostId = videoPosts[videoPosts.length - 1]?.id;

  return (
    <>
      <div
        ref={containerRef}
        className="h-screen w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
      >
        {videoPosts.length === 0 ? (
          <div className="flex h-screen items-center justify-center">
            <p>No videos available</p>
          </div>
        ) : (
          videoPosts.map((post, index) => (
            <div
              key={post.id}
              className={`relative mx-auto aspect-[450/742] h-[742px] w-[408px] flex-shrink-0 snap-start ${
                isCommentOpen ? 'translate-x-[-150px]' : 'translate-x-0'
              } transition-transform duration-400 ease-in-out`}
            >
              {post.media.map(
                (media, mediaIndex) =>
                  media.mediaType === 'VIDEO' && (
                    <PostReels
                      key={mediaIndex}
                      src={media.url}
                      ref={(el) => {
                        videoRefs.current[index] = el;
                        if (post.id === lastPostId && el) loadMoreRef(el);
                      }}
                      loop
                      muted={isMutedGlobally}
                      onPauseChange={(isPaused) => handlePauseChange(post.id, isPaused)}
                      onMuteChange={handleMuteChange}
                    />
                  )
              )}
              <div className="absolute bottom-6 left-4 flex flex-col text-white">
                <div className="flex items-center">
                  <div
                    className="h-10 min-h-10 w-10 min-w-10 cursor-pointer overflow-hidden rounded-full"
                    onClick={() => goToProfile(post?.user?.username)}
                  >
                    <Image
                      src={
                        post?.user?.avatar?.url
                          ? `${post?.user?.avatar?.url.replace(
                              '/upload/',
                              '/upload/w_80,h_80,c_fill,q_auto/'
                            )}`
                          : '/images/unify_icon_2.png'
                      }
                      width={40}
                      height={40}
                      alt={post?.user?.avatar?.url ? 'User Avatar' : 'Default Avatar'}
                      className={
                        post?.user?.avatar?.url
                          ? 'rounded-full bg-gray-600'
                          : 'rounded-full bg-zinc-700'
                      }
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                      quality={100}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pl-2">
                    <span
                      className="cursor-pointer font-medium"
                      onClick={() => goToProfile(post?.user?.username)}
                    >
                      {post.user?.username}
                    </span>
                    <span className="text-lg text-white">•</span>
                    {user?.id !== post.user.id && (
                      <FollowButton
                        contentFollow="Follow"
                        contentFollowing="Following"
                        userId={user?.id}
                        followingId={post.user.id}
                        classFollow="backdrop-blur-lg text-sm p-4 py-1 rounded-2xl font-bold transition-all duration-200 ease-in-out active:scale-125 hover:bg-black/50 border border-gray-300"
                        classFollowing="backdrop-blur-lg text-sm p-4 py-1 rounded-2xl font-bold transition-all duration-200 ease-in-out active:scale-125 hover:bg-black/50 border border-gray-300"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-2 w-[350px]">
                  <CaptionWithMore text={post.captions} />
                </div>
              </div>
              <div className="absolute right-4 top-2/3 flex -translate-y-1/2 transform flex-col items-center space-y-7 text-2xl text-white">
                <LikeButton
                  userId={user?.id}
                  postId={post.id}
                  className="m-0"
                  classText="text-sm"
                />
                <div className="flex flex-col items-center">
                  <i
                    className="fa-regular fa-comment cursor-pointer transition hover:opacity-50 focus:opacity-50"
                    onClick={() => toggleComment(post.id)}
                  />
                  <span className="text-sm">{post.commentCount || 0}</span>
                </div>
                <div className="flex flex-col items-center">
                  <i
                    onClick={onOpen}
                    className="fa-regular fa-paper-plane transition hover:opacity-50 focus:opacity-50"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <BookmarkButton postId={post.id} />
                </div>
                <div className="relative flex flex-col items-center">
                  <i
                    className="fa-solid fa-ellipsis cursor-pointer transition hover:opacity-50 focus:opacity-50"
                    onClick={() => togglePopup(post.id)}
                  />
                  {postStates[post.id]?.isPopupOpen && (
                    <div
                      id="overmore"
                      className="absolute right-10 top-[-138px] z-50 mt-2 w-48 rounded-lg border border-gray-300 p-4 text-white shadow-lg backdrop-blur-xl"
                      onClick={(e) => closeMore(e, post.id)}
                    >
                      <ul className="text-sm">
                        <li
                          className="cursor-pointer rounded-sm p-2 text-left font-bold text-red-500 hover:bg-black/30 hover:backdrop-blur-sm"
                          onClick={() => openReportModal(post.id)}
                        >
                          Report
                        </li>
                        <li
                          className="cursor-pointer rounded-sm p-2 text-left font-bold hover:bg-black/30 hover:backdrop-blur-sm"
                          onClick={handleCopyLink}
                        >
                          Copy link
                        </li>
                        <li
                          className="cursor-pointer rounded-sm p-2 text-left font-bold hover:bg-black/30 hover:backdrop-blur-sm"
                          onClick={() => goToProfile(post?.user?.username)}
                        >
                          About this account
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <ReportModal
                isOpen={postStates[post.id]?.isModalOpen || false}
                onClose={() => closeModal(post.id)}
                onSubmit={(postId, reason, urls) => handleReportPost(postId, reason, urls)}
                postId={post.id}
              />
            </div>
          ))
        )}

        {isFetchingNextPage && <div className="py-4 text-center text-white">Loading more...</div>}

        <ShareReels
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          selectedAvatars={selectedAvatars}
          setSelectedAvatars={setSelectedAvatars}
          handleShare={handleShare}
        />
        {isCommentOpen && currentPostId && (
          <div
            id="overlay"
            className={`fixed left-0 top-0 z-20 h-full w-full transition-opacity duration-300 ease-in-out ${
              isCommentOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={(e) => {
              if (e.target.id === 'overlay') {
                setIsCommentOpen(false);
                setCurrentPostId(null);
              }
            }}
          >
            <div
              className={`fixed right-0 top-0 h-full w-[450px] transition-transform duration-300 ease-in-out ${
                isCommentOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex h-full flex-col border-l border-neutral-700 p-4">
                <div className="mb-4 flex items-center justify-between dark:text-white">
                  <h2 className="text-center text-2xl font-bold">Comments</h2>
                </div>
                <div className="no-scrollbar flex-grow overflow-auto">
                  {isLoadingComments ? (
                    [...Array(6)].map((_, index) => <CommentSkeleton key={index} />)
                  ) : sortedComments.length > 0 ? (
                    sortedComments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId}
                        onReplySubmit={handleReplySubmit}
                        onReplyClick={handleReplyClick}
                      />
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xl font-bold text-zinc-400">No comments yet</p>
                    </div>
                  )}
                </div>
                <CommentInput
                  postId={currentPostId}
                  setComments={(newComments) => updateComments(currentPostId, newComments)}
                  parentComment={replyingTo}
                  onCancelReply={handleCancelReply}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
