'use client';

import { useAuthStore } from '@/src/stores/auth.store';
import { File, FileText, FileImage, FileVideo, FileMusic } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';


const PostDetailModal = dynamic(() => import('@/src/components/base/post-detail-modal'), { ssr: false });

const POST_LINK_REGEX = /https?:\/\/localhost:3000\/posts\/([0-9a-fA-F\-]{36})/g;
const POST_SHARE_REGEX = /^POST_SHARE:([0-9a-fA-F\-]{36})$/;

const Message = ({ messages, messagesEndRef, avatar, onRetryMessage }) => {
  const user = useAuthStore((s) => s.user);
  const currentUser = user?.id;
  const [openPostId, setOpenPostId] = useState(null);
  const [postDetail, setPostDetail] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [previewMap, setPreviewMap] = useState({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState([]);

  const getFileIcon = (fileExtension) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension))
      return <FileImage size={20} />;
    if (['mp4', 'webm', 'ogg'].includes(fileExtension)) return <FileVideo size={20} />;
    if (['mp3', 'wav', 'ogg'].includes(fileExtension)) return <FileMusic size={20} />;
    if (['pdf'].includes(fileExtension)) return <FileText size={20} />;
    return <File size={20} />;
  };

  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'unknown_file';
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
        postsQueryApi.getPostsById(postId)
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
        let mediaItem = Array.isArray(preview.media) ? preview.media.find(m => m && (m.mediaType === 'IMAGE' || m.mediaType === 'VIDEO')) : null;
        let mediaUrl = mediaItem?.url || '/images/A_black_image.jpg';
        let isVideo = mediaItem?.mediaType === 'VIDEO';
        return (
          <div
            className="relative border rounded-xl p-3 bg-white dark:bg-neutral-800 shadow-md cursor-pointer hover:shadow-lg transition group max-w-xs min-w-[220px] hover:border-blue-400"
            onClick={() => setOpenPostId(postId)}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={preview.user?.avatar?.url || '/images/avatar.png'}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border"
              />
              <span className="font-semibold text-gray-900 dark:text-white truncate">{preview.user?.username}</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border bg-black">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    className="w-16 h-16 object-cover rounded-lg"
                    preload="metadata"
                    controls={false}
                    muted
                    playsInline
                    style={{ pointerEvents: 'none' }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="media"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition">
                  <span className="text-xs text-white font-semibold">Details</span>
                </div>
                {isVideo && (
                  <div className="absolute right-1 top-1 bg-black/60 rounded px-1 py-0.5 text-xs text-white">
                    <i className="fa-solid fa-film"></i>
                  </div>
                )}
              </div>
              <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200 ml-2 max-w-[120px]">
                {preview.captions || 'Không có mô tả'}
              </span>
            </div>
          </div>
        );
      }
      return (
        <div className="inline-block px-3 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse min-w-[180px]">
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
        <span key={postId} className="text-blue-400 underline cursor-pointer hover:text-blue-600" onClick={() => handlePostLinkClick(postId)}>
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

  return (
    <div className="m-4 mb-0 flex flex-col gap-3">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender === currentUser;
        const isFirstOfGroup = index === 0 || messages[index - 1].sender !== message.sender;
        const isLastOfGroup =
          index === messages.length - 1 || messages[index + 1].sender !== message.sender;

        return (
          <div
            key={`${message.id || message.timestamp || 'no-id'}-${index}`}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
              message.isOptimistic ? 'opacity-70' : ''
            } ${message.isFailed ? 'opacity-50' : ''}`}
          >
            {isFirstOfGroup && !isCurrentUser && (
              <div className="mr-3">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full border-2 border-neutral-700"
                  width={35}
                  height={35}
                />
              </div>
            )}

            <div
              className={`flex max-w-[75%] flex-col ${
                isCurrentUser ? 'items-end' : 'items-start'
              } ${!isCurrentUser && !isFirstOfGroup ? 'pl-[50px]' : ''}`}
            >
              {message.fileUrls?.length > 0 && (
                <div className="mb-3 mt-2 flex flex-wrap gap-2">
                  {message.fileUrls.map((fileUrl, fileIndex) => {
                    const fileName = fileUrl.split('/').pop().split('?')[0];
                    const fileExtension = fileName.split('.').pop().toLowerCase();
                    return (
                      <div key={fileIndex} className="flex flex-col items-start">
                        {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension) ? (
                          <a href={fileUrl} target={`_blan`}>
                            <img
                              src={fileUrl}
                              alt={`attachment-${fileIndex}`}
                              className="max-w-100 w-[500px] rounded-lg shadow-md"
                              onLoad={() => handleMediaLoad(messagesEndRef)}
                            />
                          </a>
                        ) : ['mp4', 'webm', 'ogg', 'mp3'].includes(fileExtension) ? (
                          <video
                            src={fileUrl}
                            controls
                            className="max-w-xs rounded-lg shadow-md"
                            onLoadedData={() => handleMediaLoad(messagesEndRef)}
                          />
                        ) : ['mp3', 'wav', 'ogg'].includes(fileExtension) ? (
                          <audio
                            controls
                            className="w-full"
                            onLoadedData={() => handleMediaLoad(messagesEndRef)}
                          >
                            <source src={fileUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-md transition hover:bg-blue-600"
                          >
                            {getFileIcon(fileExtension)}
                            <span>{getFileName(fileUrl)}</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {message.content && (
                <div
                  className={`rounded-2xl p-3 shadow-md ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-white dark:bg-zinc-800'
                  } ${message.isOptimistic ? 'animate-pulse' : ''} ${
                    message.isFailed ? 'bg-red-500' : ''
                  }`}
                >
                  {renderContent(message.content)}
                  {message.isOptimistic && (
                    <div className="text-xs opacity-50 mt-1">Sending...</div>
                  )}
                  {message.isFailed && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs opacity-75">Failed to send</div>
                      <button
                        onClick={() => onRetryMessage?.(message.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isLastOfGroup && (
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
      {openPostId && (
        <PostDetailModal postId={openPostId} onClose={() => setOpenPostId(null)} />
      )}
    </div>
  );
};

export default Message;
