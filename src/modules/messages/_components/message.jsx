'use client';

import { useAuthStore } from '@/src/stores/auth.store';
import { File, FileText, FileImage, FileVideo, FileMusic } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import EnhancedMedia from './enhanced-media';
import Link from 'next/link';

const PostDetailModal = dynamic(() => import('@/src/components/base/post-detail-modal'), {
  ssr: false,
});

const POST_LINK_REGEX = /https?:\/\/localhost:3000\/posts\/([0-9a-fA-F\-]{36})/g;
const POST_SHARE_REGEX = /^POST_SHARE:([0-9a-fA-F\-]{36})$/;

const Message = ({ messages, messagesEndRef, avatar, onRetryMessage }) => {
  const t = useTranslations('Messages');
  const user = useAuthStore((s) => s.user);
  const currentUser = user?.id;
  const [openPostId, setOpenPostId] = useState(null);
  const [postDetail, setPostDetail] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [previewMap, setPreviewMap] = useState({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState([]);

  // Debug logging for optimistic messages
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const optimisticMessages = messages.filter((msg) => msg.isOptimistic);
      if (optimisticMessages.length > 0) {
      }
    }
  }, [messages]);

  const getFileIcon = (fileExtension) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension))
      return <FileImage size={20} />;
    if (['mp4', 'webm', 'ogg'].includes(fileExtension)) return <FileVideo size={20} />;
    if (['mp3', 'wav', 'ogg'].includes(fileExtension)) return <FileMusic size={20} />;
    if (['pdf'].includes(fileExtension)) return <FileText size={20} />;
    return <File size={20} />;
  };

  const getFileName = (fileUrl) => {
    if (!fileUrl) return t('UnknownFile');
    const fullName = fileUrl.split('/').pop();
    return fullName.replace(/^[0-9a-fA-F-]+-/, '');
  };

  const handleMediaLoad = (messagesEndRef) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePostLinkClick = async (postId) => {
    setLoadingPost(true);
    setOpenPostId(postId);
    try {
      const data = await postsQueryApi.getPostsById(postId);
      setPostDetail(data);
    } catch (e) {
      setPostDetail(null);
    } finally {
      setLoadingPost(false);
    }
  };

  // Quét các postId cần preview
  useEffect(() => {
    const idsToFetch = messages
      .map((msg) => {
        const match = msg.content?.match(POST_SHARE_REGEX);
        return match ? match[1] : null;
      })
      .filter((id) => id && !previewMap[id] && !loadingPreviewIds.includes(id));
    if (idsToFetch.length > 0) {
      setLoadingPreviewIds((prev) => [...prev, ...idsToFetch]);
      idsToFetch.forEach((postId) => {
        postsQueryApi
          .getPostsById(postId)
          .then((data) => setPreviewMap((prev) => ({ ...prev, [postId]: data })))
          .catch(() => setPreviewMap((prev) => ({ ...prev, [postId]: null })))
          .finally(() => setLoadingPreviewIds((prev) => prev.filter((id) => id !== postId)));
      });
    }
  }, [messages, previewMap, loadingPreviewIds]);

  const renderContent = (content) => {
    const match = content.match(POST_SHARE_REGEX);
    if (match) {
      const postId = match[1];
      const preview = previewMap[postId];
      if (preview) {
        let mediaItem = Array.isArray(preview.media)
          ? preview.media.find((m) => m && (m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO'))
          : null;
        let mediaUrl = mediaItem?.url || '/images/A_black_image.jpg';
        let isVideo = mediaItem?.mediaType === 'VIDEO';
        return (
          <div
            className="group relative min-w-[220px] max-w-xs cursor-pointer rounded-xl border bg-white p-3 shadow-md transition hover:border-blue-400 hover:shadow-lg dark:bg-neutral-800"
            onClick={() => setOpenPostId(postId)}
          >
            <div className="mb-2 flex items-center gap-2">
              <img
                src={preview.user?.avatar?.url || '/images/avatar.png'}
                alt="avatar"
                className="h-8 w-8 rounded-full border object-cover"
              />
              <span className="truncate font-semibold text-gray-900 dark:text-white">
                {preview.user?.username}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-black">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    className="h-16 w-16 rounded-lg object-cover"
                    preload="metadata"
                    controls={false}
                    muted
                    playsInline
                    style={{ pointerEvents: 'none' }}
                  />
                ) : (
                  <img src={mediaUrl} alt="media" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 opacity-0 transition group-hover:opacity-100">
                  <span className="text-xs font-semibold text-white">Details</span>
                </div>
                {isVideo && (
                  <div className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 text-xs text-white">
                    <i className="fa-solid fa-film"></i>
                  </div>
                )}
              </div>
              <span className="ml-2 line-clamp-2 max-w-[120px] text-sm text-gray-700 dark:text-gray-200">
                {preview.captions || 'Không có mô tả'}
              </span>
            </div>
          </div>
        );
      }
      return (
        <div className="inline-block min-w-[180px] animate-pulse rounded-lg bg-gray-100 px-3 py-2 dark:bg-neutral-700">
          Đang tải bài viết...
        </div>
      );
    }
    return content;
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = [];
    let lastIndex = 0;
    let match;
    POST_LINK_REGEX.lastIndex = 0;
    while ((match = POST_LINK_REGEX.exec(content)) !== null) {
      const [url, postId] = match;
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <span
          key={postId}
          className="cursor-pointer text-blue-400 underline hover:text-blue-600"
          onClick={() => handlePostLinkClick(postId)}
        >
          {url}
        </span>
      );
      lastIndex = match.index + url.length;
    }
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    return parts;
  };

  // ✅ Helper function to check if this is the last message from current user
  const isLastMessageFromCurrentUser = (messageIndex) => {
    const message = messages[messageIndex];
    if (message.sender !== currentUser) return false;

    // Check if there are any subsequent messages from current user
    for (let i = messageIndex + 1; i < messages.length; i++) {
      if (messages[i].sender === currentUser) {
        return false; // Found a later message from current user
      }
    }
    return true; // This is the last message from current user
  };

  // ✅ Format timestamp to show day and time like "Da 15:36"
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Format time as HH:MM
    const timeString = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if message is from today
    if (messageDate.getTime() === today.getTime()) {
      return timeString; // Just show time for today's messages
    }

    // Check if message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${timeString}`;
    }

    // Check if message is from this week
    const dayOfWeek = date.getDay();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (messageDate > weekAgo) {
      return `${weekDays[dayOfWeek]} ${timeString}`;
    }

    // For older messages, show date
    return (
      date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }) + ` ${timeString}`
    );
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender === currentUser;
        const isFirstOfGroup = index === 0 || messages[index - 1].sender !== message.sender;
        const isLastOfGroup =
          index === messages.length - 1 || messages[index + 1].sender !== message.sender;
        const shouldShowStatus = isCurrentUser && isLastMessageFromCurrentUser(index);

        return (
          <div
            key={`${message.id || message.timestamp || 'no-id'}-${index}`}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            {isFirstOfGroup && !isCurrentUser && (
              <div className="mr-3">
                <Link
                  href={`/profile/${messages[0]?.sender || 'unknown'}`}
                  className="transition-opacity hover:opacity-80"
                >
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="h-10 w-10 cursor-pointer rounded-full border-2 border-neutral-700"
                    width={35}
                    height={35}
                  />
                </Link>
              </div>
            )}

            <div
              className={`flex max-w-[75%] min-w-0 flex-col ${
                isCurrentUser ? 'items-end' : 'items-start'
              } ${!isCurrentUser && !isFirstOfGroup ? 'pl-[50px]' : ''}`}
            >
              {message.isOptimistic && message.isUploading ? (
                // ✅ Skeleton loading for entire uploading message
                <div className="space-y-3">
                  {/* File skeleton */}
                  {message.fileUrls?.length > 0 && (
                    <div className="flex flex-col items-start gap-2">
                      {Array.from({ length: Math.min(message.fileUrls.length, 3) }).map(
                        (_, index) => (
                          <div key={index} className="flex flex-col items-start">
                            <div className="h-24 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-700"></div>
                            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-neutral-700"></div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Text skeleton */}
                  {message.content && (
                    <div className="rounded-2xl bg-blue-600/50 p-3 pb-1 shadow-md">
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-blue-500/30"></div>
                        <div className="h-4 w-1/2 animate-pulse rounded bg-blue-500/30"></div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 pb-1 text-xs text-white">
                        <div className="h-3 w-16 animate-pulse rounded bg-blue-500/30"></div>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
                          <span className="italic text-blue-400">Sending...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {message.fileUrls?.length > 0 && (
                    <div className="mb-3 mt-2 flex flex-col flex-wrap items-end gap-2 transition-all duration-300 ease-in-out">
                      {message.fileUrls.map((fileUrl, fileIndex) => {
                        // Check if this is a new enhanced format with metadata
                        if (typeof fileUrl === 'object' && fileUrl.url) {
                          // Enhanced format with metadata
                          return (
                            <div key={fileIndex} className="flex flex-col items-start">
                              <EnhancedMedia
                                fileUrl={fileUrl.url}
                                fileName={fileUrl.name || 'File'}
                                fileType={fileUrl.type || 'application/octet-stream'}
                                thumbnailUrl={fileUrl.thumbnailUrl}
                                base64Data={fileUrl.base64Data}
                                variants={fileUrl.variants || {}}
                                onLoad={() => handleMediaLoad(messagesEndRef)}
                                onError={() => {
                                  /* Error handled silently */
                                }}
                                maxWidth="500px"
                                maxHeight="400px"
                                lazyLoad={true}
                              />
                              {fileUrl.compressionRatio && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Compressed: {fileUrl.compressionRatio}% smaller
                                </div>
                              )}
                              {message.isOptimistic && (
                                <div className="mt-1 text-xs font-medium italic text-green-400">
                                  {message.isUploading ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                                      <span className="text-blue-400">Uploading...</span>
                                    </div>
                                  ) : (
                                    '✅ File attached'
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Legacy format - direct URL string
                        if (typeof fileUrl === 'string') {
                          // ✅ FIXED: Handle uploading status strings smoothly
                          if (fileUrl.startsWith('Uploading ')) {
                            return (
                              <div key={fileIndex} className="flex flex-col items-start">
                                <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-3 dark:border-neutral-600 dark:bg-neutral-700">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {fileUrl}
                                  </span>
                                </div>
                                {message.isOptimistic && (
                                  <div className="mt-1 text-xs font-medium italic text-green-400">
                                    {message.isUploading ? (
                                      <span className="text-blue-400">⏳ Uploading...</span>
                                    ) : (
                                      '✅ File attached'
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          const fileName = fileUrl.split('/').pop().split('?')[0];
                          const fileExtension = fileName.split('.').pop().toLowerCase();

                          return (
                            <div key={fileIndex} className="flex flex-col items-start">
                              <EnhancedMedia
                                fileUrl={fileUrl}
                                fileName={fileName}
                                fileType={fileExtension}
                                onLoad={() => handleMediaLoad(messagesEndRef)}
                                onError={() => {
                                  /* Error handled silently */
                                }}
                                maxWidth="500px"
                                maxHeight="400px"
                                lazyLoad={true}
                              />
                              {message.isOptimistic && (
                                <div className="mt-1 text-xs font-medium italic text-green-400">
                                  {message.isUploading ? (
                                    <span className="text-blue-400">⏳ Uploading...</span>
                                  ) : (
                                    '✅ File attached'
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Fallback for unknown format
                        return null;
                      })}
                    </div>
                  )}

                  {message.content && (
                    <div
                      className={`rounded-2xl p-3 pb-1 shadow-md transition-all duration-300 ease-in-out ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-700 text-white dark:bg-zinc-800'
                      } opacity-100`}
                    >
                      {renderContent(message.content)}
                      <div className="flex items-center gap-2 pb-1 text-xs text-[#d4d7de] dark:text-white">
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  )}

                  {/* Simplified time display */}
                  <div
                    className={`mt-1 flex items-center ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {isLastOfGroup && (
                      <div className="flex items-center">
                        {message.isOptimistic ? (
                          <div className="flex items-center">
                            {message.isUploading ? (
                                <span className="text-xs italic text-zinc-400">Sending...</span>
                            ) : (
                              <>
                                <span className="text-xs italic text-zinc-400">Sent</span>
                              </>
                            )}
                          </div>
                        ) : (
                          isCurrentUser && (
                              <span className="text-xs italic text-zinc-400">Delivered</span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
      {openPostId && <PostDetailModal postId={openPostId} onClose={() => setOpenPostId(null)} />}
    </div>
  );
};

export default Message;
