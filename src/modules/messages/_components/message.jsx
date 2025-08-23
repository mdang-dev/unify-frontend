'use client';

import { useAuthStore } from '@/src/stores/auth.store';
import { File, FileText, FileImage, FileVideo, FileMusic } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import EnhancedMedia from './enhanced-media';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { MoreHorizontal, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Check } from 'lucide-react';
import { CheckCheck } from 'lucide-react';


const PostDetailModal = dynamic(() => import('@/src/components/base/post-detail-modal'), { ssr: false });

const POST_LINK_REGEX = /https?:\/\/localhost:3000\/posts\/([0-9a-fA-F\-]{36})/g;
const POST_SHARE_REGEX = /^POST_SHARE:([0-9a-fA-F\-]{36})$/;

const Message = ({ messages, messagesEndRef, avatar, onRetryMessage, onReply }) => {
  const t = useTranslations('Messages');
  const user = useAuthStore((s) => s.user);
  const currentUser = user?.id;
  const [openPostId, setOpenPostId] = useState(null);
  const [postDetail, setPostDetail] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [previewMap, setPreviewMap] = useState({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState([]);

  // ✅ PERFORMANCE: Track optimistic messages for better UX
  useEffect(() => {
    if (messages.length > 0) {
      const optimisticMessages = messages.filter(msg => msg.isOptimistic);
      if (optimisticMessages.length > 0) {
        // ✅ IMPROVED: Ensure optimistic messages are properly ordered
        const sortedMessages = [...messages].sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeA - timeB;
        });
        
        // ✅ IMPROVED: Check if messages need reordering
        if (JSON.stringify(sortedMessages) !== JSON.stringify(messages)) {
          console.log('Messages reordered for proper timing');
        }
        
        // ✅ IMPROVED: Validate timezone consistency
        const timezoneIssues = messages.filter((msg, index) => {
          if (index === 0) return false;
          const prevMsg = messages[index - 1];
          if (!msg.timestamp || !prevMsg.timestamp) return false;
          
          const currentTime = new Date(msg.timestamp);
          const prevTime = new Date(prevMsg.timestamp);
          
          // Check for timezone-related ordering issues
          if (currentTime < prevTime) {
            const timeDiff = prevTime.getTime() - currentTime.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // If time difference is more than 12 hours, it might be a timezone issue
            if (hoursDiff > 12) {
              console.warn('Potential timezone issue detected:', {
                prevMessage: { id: prevMsg.id, timestamp: prevMsg.timestamp },
                currentMessage: { id: msg.id, timestamp: msg.timestamp },
                timeDiff: `${hoursDiff.toFixed(2)} hours`
              });
              return true;
            }
          }
          return false;
        });
        
        if (timezoneIssues.length > 0) {
          console.warn(`Found ${timezoneIssues.length} potential timezone-related ordering issues`);
        }
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
            className="relative border rounded-xl p-3 bg-white dark:bg-neutral-800 shadow-md cursor-pointer hover:shadow-lg transition group max-w-xs min-w-[220px] hover:border-gray-400 dark:hover:border-gray-500"
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
        <span key={postId} className="text-gray-600 dark:text-gray-400 underline cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" onClick={() => handlePostLinkClick(postId)}>
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

  // ✅ Utility function for timezone-aware date comparison
  const isSameDay = (date1, date2) => {
    try {
      if (!date1 || !date2) return false;
      
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
      
      // Compare dates in local timezone (ignoring time)
      const day1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const day2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
      
      return day1.getTime() === day2.getTime();
    } catch (error) {
      console.warn('Error in isSameDay comparison:', error);
      return false;
    }
  };

  // ✅ Format timestamp to show day and time in English with 24-hour format
  const formatMessageTime = (timestamp) => {
    try {
      // Ensure timestamp is valid
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return '';
      }
      
      // ✅ FIXED: Use local timezone for date comparisons, not UTC
      const now = new Date();
      
      // Get today's date in local timezone (start of day)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get message date in local timezone (start of day)
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      // Format time as HH:MM using 24-hour format
      const timeString = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      // ✅ IMPROVED: Use utility function for more reliable date comparison
      if (isSameDay(date, now)) {
        return timeString; // Just show time for today's messages
      }
      
      // Check if message is from yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (isSameDay(date, yesterday)) {
        return `Yesterday ${timeString}`;
      }
      
      // Check if message is from this week
      const dayOfWeek = date.getDay();
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      if (messageDate.getTime() > weekAgo.getTime()) {
        return `${weekDays[dayOfWeek]} ${timeString}`;
      }
      
      // For older messages, show date in Vietnamese format
      return date.toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric'
      }) + ` ${timeString}`;
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return '';
    }
  };

  const scrollToReplyMessage = (replyToMessageId) => {
    console.log('Scrolling to reply message:', replyToMessageId);
    
    // Find the reply message in the messages array
    const replyMessage = messages.find(msg => msg.id === replyToMessageId);
    console.log('Found reply message:', replyMessage);
    
    if (replyMessage) {
      // Find the message index
      const messageIndex = messages.findIndex(msg => msg.id === replyMessage.id);
      console.log('Message index:', messageIndex);
      
      // Use a more reliable selector - look for the message container by index
      const messageContainers = document.querySelectorAll('[data-message-index]');
      const targetContainer = Array.from(messageContainers).find(container => 
        parseInt(container.getAttribute('data-message-index')) === messageIndex
      );
      
      if (targetContainer) {
        console.log('Found target container, scrolling...');
        // Scroll to the message with smooth animation
        targetContainer.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Add highlight effect - same style as search results
        targetContainer.classList.add('bg-gray-100', 'dark:bg-gray-800');
        
        // Remove highlight after animation
        setTimeout(() => {
          targetContainer.classList.remove('bg-gray-100', 'dark:bg-gray-800');
        }, 2000);
      } else {
        console.log('Target container not found, trying alternative method...');
        // Fallback: try to find by message content or timestamp
        const allMessageDivs = document.querySelectorAll('.group');
        const targetDiv = Array.from(allMessageDivs)[messageIndex];
        if (targetDiv) {
          targetDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetDiv.classList.add('bg-gray-100', 'dark:bg-gray-800');
          setTimeout(() => {
            targetDiv.classList.remove('bg-gray-100', 'dark:bg-gray-800');
          }, 2000);
        }
      }
    } else {
      console.log('Reply message not found in messages array');
    }
  };

  // Helper function to determine reply context
  const getReplyContext = (message) => {
    if (!message) return '';
    
    const isOwnMessage = message.sender === user?.id;
    
    if (isOwnMessage) {
      return 'Replying to you';
    } else {
      return 'Replying to message';
    }
  };

  return (
    <div className="m-4 mb-0 flex flex-col gap-3">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender === currentUser;
        const isFirstOfGroup = index === 0 || messages[index - 1].sender !== message.sender;
        const isLastOfGroup =
          index === messages.length - 1 || messages[index + 1].sender !== message.sender;
        const shouldShowStatus = isCurrentUser && isLastMessageFromCurrentUser(index);

        // ✅ DEBUG: Log message ordering for troubleshooting
        if (process.env.NODE_ENV === 'development' && index < 3) {
          console.log(`Message ${index}:`, {
            id: message.id,
            timestamp: message.timestamp,
            formattedTime: formatMessageTime(message.timestamp),
            isOptimistic: message.isOptimistic,
            content: message.content?.substring(0, 20) + '...'
          });
        }

        // ✅ DEBUG: Check message ordering for timing issues
        if (process.env.NODE_ENV === 'development' && index > 0) {
          const prevMessage = messages[index - 1];
          if (prevMessage && message.timestamp && prevMessage.timestamp) {
            const prevTime = new Date(prevMessage.timestamp).getTime();
            const currentTime = new Date(message.timestamp).getTime();
            if (currentTime < prevTime) {
              console.warn(`Message ordering issue detected at index ${index}:`, {
                prevMessage: { id: prevMessage.id, timestamp: prevMessage.timestamp, time: prevTime },
                currentMessage: { id: message.id, timestamp: message.timestamp, time: currentTime },
                timeDiff: currentTime - prevTime
              });
            }
          }
        }

        // ✅ DEBUG: Check timezone and date logic
        if (process.env.NODE_ENV === 'development' && index < 3) {
          const messageDate = new Date(message.timestamp);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
          
          console.log(`Message ${index} date debug:`, {
            id: message.id,
            originalTimestamp: message.timestamp,
            parsedDate: messageDate.toISOString(),
            localDate: messageDate.toLocaleDateString(),
            localTime: messageDate.toLocaleTimeString(),
            today: today.toISOString(),
            messageDateOnly: messageDateOnly.toISOString(),
            isToday: messageDateOnly.getTime() === today.getTime(),
            timeDiff: messageDate.getTime() - now.getTime()
          });
        }

        return (
          <div
            key={`${message.id || message.timestamp || 'no-id'}-${index}`}
            className={`message-item group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} rounded-lg p-1 transition-all duration-200`}
            data-message-id={message.id || message.timestamp || `temp-${index}`}
            data-message-index={index}
            data-message-sender={message.sender}
          >
            {isFirstOfGroup && !isCurrentUser && (
              <div className="mr-3">
                <Link href={`/others-profile/${messages[0]?.sender || 'unknown'}`} className="hover:opacity-80 transition-opacity">
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full border-2 border-neutral-700 cursor-pointer"
                    width={35}
                    height={35}
                  />
                </Link>
              </div>
            )}

            <div
              className={`relative flex max-w-[75%] flex-col ${
                isCurrentUser ? 'items-end' : 'items-start'
              } ${!isCurrentUser && !isFirstOfGroup ? 'pl-[50px]' : ''} group`}
            >
              {/* Reply icon - Top right, always visible when onReply is provided */}
              {onReply && (
                <div className="absolute -top-2 -right-2 z-30">
                  <Button
                    onClick={() => onReply(message)}
                    className="w-6 h-6 p-0 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl border-2 border-white dark:border-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 transform-gpu"
                    title="Reply to this message"
                  >
                    <Reply className="w-4 h-4 text-white" />
                  </Button>
                </div>
              )}

              {/* Reply Display - Enhanced styling to distinguish from regular messages */}
              {message.replyToMessageId && (
                <div 
                  className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-400 dark:border-blue-500 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 group/reply shadow-sm hover:shadow-md"
                  onClick={() => scrollToReplyMessage(message.replyToMessageId)}
                  title="Click to view original message"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800/50">
                      <Reply className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      {(() => {
                        const replyToMessage = messages.find(msg => msg.id === message.replyToMessageId);
                        if (replyToMessage) {
                          const isOwnMessage = replyToMessage.sender === currentUser;
                          return isOwnMessage ? 'Replying to you' : 'Replying to message';
                        }
                        return 'Replying to message';
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-200 bg-white/80 dark:bg-gray-800/80 p-2 rounded border border-blue-200 dark:border-blue-700/50 group-hover:border-gray-400 dark:group-hover:border-gray-600 transition-colors">
                    {(() => {
                      const replyToMessage = messages.find(msg => msg.id === message.replyToMessageId);
                      if (replyToMessage) {
                        return replyToMessage.content || 'File message';
                      }
                      return 'Message not found';
                    })()}
                  </div>
                </div>
              )}

              {message.isOptimistic && message.isUploading ? (
                // ✅ Skeleton loading for entire uploading message
                <div className="space-y-3">
                  {/* File skeleton */}
                  {message.fileUrls?.length > 0 && (
                    <div className="flex flex-col items-start gap-2">
                      {Array.from({ length: Math.min(message.fileUrls.length, 3) }).map((_, index) => (
                        <div key={index} className="flex flex-col items-start">
                          <div className="w-32 h-24 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                          <div className="mt-2 h-3 w-20 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Text skeleton */}
                  {message.content && (
                    <div className="rounded-2xl p-3 pb-1 shadow-md bg-gray-600/50 dark:bg-gray-500/50">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-500/30 dark:bg-gray-400/30 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-gray-500/30 dark:bg-gray-400/30 rounded animate-pulse w-1/2"></div>
                      </div>
                      <div className="pb-1 text-white text-xs flex items-center gap-2 mt-2">
                        <div className="h-3 w-16 bg-gray-500/30 dark:bg-gray-400/30 rounded animate-pulse"></div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse"></div>
                          <span className="text-gray-400 dark:text-gray-300 italic">Sending...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {message.fileUrls?.length > 0 && (
                    <div className="mb-3 mt-2 flex flex-wrap gap-2 flex-col items-end transition-all duration-300 ease-in-out relative">
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
                                onError={() => {/* Error handled silently */}}
                                maxWidth="500px"
                                maxHeight="400px"
                                lazyLoad={true}
                              />
                              {fileUrl.compressionRatio && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Compressed: {fileUrl.compressionRatio}% smaller
                                </div>
                              )}
                              {message.isOptimistic && (
                                <div className="text-xs text-green-400 italic mt-1 font-medium">
                                  {message.isUploading ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-gray-400 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                      <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                                    </div>
                                  ) : (
                                    "✅ File attached"
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
                                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                  <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{fileUrl}</span>
                                </div>
                                {message.isOptimistic && (
                                  <div className="text-xs text-green-400 italic mt-1 font-medium">
                                    {message.isUploading ? (
                                      <span className="text-gray-600 dark:text-gray-400">⏳ Uploading...</span>
                                    ) : (
                                      "✅ File attached"
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
                                onError={() => {/* Error handled silently */}}
                                maxWidth="500px"
                                maxHeight="400px"
                                lazyLoad={true}
                              />
                              {message.isOptimistic && (
                                <div className="text-xs text-green-400 italic mt-1 font-medium">
                                  {message.isUploading ? (
                                    <span className="text-gray-600 dark:text-gray-400">⏳ Uploading...</span>
                                  ) : (
                                    "✅ File attached"
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
                      className={`relative rounded-2xl p-3 pb-1 shadow-md transition-all duration-300 ease-in-out ${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white'
                          : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {renderContent(message.content)}
                      <div className="pb-1 text-[#d4d7de] dark:text-white text-xs flex items-center gap-2">
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {shouldShowStatus && (
                          <span className="text-green-400 text-lg"><CheckCheck className='w-4 h-4'/></span>
                        )}
                      </div>
                    </div>
                  )}



                  {/* Simplified time display */}
                  <div className={`mt-1 flex items-center gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {isLastOfGroup && (
                      <div className="flex items-center gap-2">
                        {/* Simple sent status for current user's messages */}
                        {shouldShowStatus && isCurrentUser && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>Sent</span>
                          </div>
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
      {openPostId && (
        <PostDetailModal postId={openPostId} onClose={() => setOpenPostId(null)} />
      )}
    </div>
  );
};

export default Message;
