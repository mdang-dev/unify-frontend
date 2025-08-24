'use client';

import { useAuthStore } from '@/src/stores/auth.store';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Reply } from 'lucide-react';
import { CheckCheck } from 'lucide-react';
import MessageContent from './message-content';
import SharedPost from './message-shared-post';

const PostDetailModal = dynamic(() => import('@/src/components/base/post-detail-modal'), {
  ssr: false,
});

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
      const optimisticMessages = messages.filter((msg) => msg.isOptimistic);
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
                timeDiff: `${hoursDiff.toFixed(2)} hours`,
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
    // For regular text content, just return as is
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
          className="cursor-pointer text-gray-600 underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
        hour12: false,
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
      return (
        date.toLocaleDateString('vi-VN', {
          month: 'short',
          day: 'numeric',
        }) + ` ${timeString}`
      );
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return '';
    }
  };

  const scrollToReplyMessage = (replyToMessageId) => {
    console.log('Scrolling to reply message:', replyToMessageId);

    // Find the reply message in the messages array
    const replyMessage = messages.find((msg) => msg.id === replyToMessageId);
    console.log('Found reply message:', replyMessage);

    if (replyMessage) {
      // Find the message index
      const messageIndex = messages.findIndex((msg) => msg.id === replyMessage.id);
      console.log('Message index:', messageIndex);

      // Use a more reliable selector - look for the message container by index
      const messageContainers = document.querySelectorAll('[data-message-index]');
      const targetContainer = Array.from(messageContainers).find(
        (container) => parseInt(container.getAttribute('data-message-index')) === messageIndex
      );

      if (targetContainer) {
        console.log('Found target container, scrolling...');
        // Scroll to the message with smooth animation
        targetContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
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
    <div className="flex max-w-full flex-col overflow-hidden p-4 pb-1">
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
            content: message.content?.substring(0, 20) + '...',
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
                prevMessage: {
                  id: prevMessage.id,
                  timestamp: prevMessage.timestamp,
                  time: prevTime,
                },
                currentMessage: { id: message.id, timestamp: message.timestamp, time: currentTime },
                timeDiff: currentTime - prevTime,
              });
            }
          }
        }

        // ✅ DEBUG: Check timezone and date logic
        if (process.env.NODE_ENV === 'development' && index < 3) {
          const messageDate = new Date(message.timestamp);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const messageDateOnly = new Date(
            messageDate.getFullYear(),
            messageDate.getMonth(),
            messageDate.getDate()
          );

          console.log(`Message ${index} date debug:`, {
            id: message.id,
            originalTimestamp: message.timestamp,
            parsedDate: messageDate.toISOString(),
            localDate: messageDate.toLocaleDateString(),
            localTime: messageDate.toLocaleTimeString(),
            today: today.toISOString(),
            messageDateOnly: messageDateOnly.toISOString(),
            isToday: messageDateOnly.getTime() === today.getTime(),
            timeDiff: messageDate.getTime() - now.getTime(),
          });
        }

        return (
          <div
            key={`${message.id || message.timestamp || 'no-id'}-${index}`}
            className={`message-item group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} max-w-full rounded-xl p-2 transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/30`}
            data-message-id={message.id || message.timestamp || `temp-${index}`}
            data-message-index={index}
            data-message-sender={message.sender}
          >
            {isFirstOfGroup && !isCurrentUser && (
              <div className="mr-3 flex-shrink-0">
                <Link
                  href={`/others-profile/${messages[0]?.sender || 'unknown'}`}
                  className="transition-all duration-200 hover:scale-105 hover:opacity-80"
                >
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="h-10 w-10 cursor-pointer rounded-full border-2 border-blue-200 shadow-md transition-all duration-200 hover:shadow-lg dark:border-blue-700"
                    width={40}
                    height={40}
                  />
                </Link>
              </div>
            )}

            <div
              className={`relative flex min-w-0 max-w-[75%] flex-col ${
                isCurrentUser ? 'items-end' : 'items-start'
              } ${!isCurrentUser && !isFirstOfGroup ? 'pl-[50px]' : ''} group`}
            >
              {/* Reply icon - Top right, always visible when onReply is provided */}
              {onReply && (
                <div className="absolute -right-2 -top-2 z-30">
                  <Button
                    onClick={() => onReply(message)}
                    className="flex h-6 w-6 transform-gpu items-center justify-center rounded-full border-2 border-white bg-gray-600 p-0 opacity-0 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-gray-700 hover:shadow-xl group-hover:opacity-100 dark:border-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                    title="Reply to this message"
                  >
                    <Reply className="h-4 w-4 text-white" />
                  </Button>
                </div>
              )}

              {/* Reply Display - Enhanced styling to distinguish from regular messages */}
              {message.replyToMessageId && (
                <div
                  className="group/reply mb-3 cursor-pointer rounded-2xl border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-md transition-all duration-200 hover:border-blue-500 hover:from-blue-100 hover:to-indigo-100 hover:shadow-lg dark:border-blue-500 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:border-blue-400 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40"
                  onClick={() => scrollToReplyMessage(message.replyToMessageId)}
                  title="Click to view original message"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800/60">
                      <Reply className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {(() => {
                        const replyToMessage = messages.find(
                          (msg) => msg.id === message.replyToMessageId
                        );
                        if (replyToMessage) {
                          const isOwnMessage = replyToMessage.sender === currentUser;
                          return isOwnMessage ? 'Replying to you' : 'Replying to message';
                        }
                        return 'Replying to message';
                      })()}
                    </span>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-white/90 p-3 text-sm text-blue-800 transition-colors group-hover:border-blue-300 dark:border-blue-700/60 dark:bg-gray-800/90 dark:text-blue-200 dark:group-hover:border-blue-600">
                    {(() => {
                      const replyToMessage = messages.find(
                        (msg) => msg.id === message.replyToMessageId
                      );
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
                    <div className="rounded-2xl bg-gray-600/50 p-3 pb-1 shadow-md dark:bg-gray-500/50">
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-500/30 dark:bg-gray-400/30"></div>
                        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-500/30 dark:bg-gray-400/30"></div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 pb-1 text-xs text-white">
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-500/30 dark:bg-gray-400/30"></div>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 dark:bg-gray-300"></div>
                          <span className="italic text-gray-400 dark:text-gray-300">
                            Sending...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* File attachments */}
                  {message.fileUrls?.length > 0 && (
                    <MessageContent
                      fileUrls={message.fileUrls}
                      isOptimistic={message.isOptimistic}
                      isUploading={message.isUploading}
                      onMediaLoad={handleMediaLoad}
                      messagesEndRef={messagesEndRef}
                    />
                  )}

                  {/* Text content - Only render if NOT a share post */}
                  <>
                    {message.content && !message.content.match(POST_SHARE_REGEX) && (
                      <div
                        className={`relative max-w-full break-words rounded-3xl p-4 pb-2 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl ${
                          isCurrentUser
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25 dark:from-blue-600 dark:to-blue-700'
                            : 'border border-gray-100 bg-white text-gray-900 shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:shadow-gray-800/50'
                        }`}
                      >
                        <div className="break-words">{renderContent(message.content)}</div>
                        <div
                          className={`mt-2 flex items-center gap-2 pb-1 text-xs ${
                            isCurrentUser
                              ? 'text-blue-100 dark:text-blue-200'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          <span>{formatMessageTime(message.timestamp)}</span>
                        </div>
                      </div>
                    )}
                    {shouldShowStatus && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <span className="text-lg text-green-400">
                          <CheckCheck className="h-4 w-4" />
                        </span>
                        <span>Sent</span>
                      </div>
                    )}
                  </>

                  {/* Share post - Render independently outside the message bubble */}
                  {message.content &&
                    message.content.match(POST_SHARE_REGEX) &&
                    (() => {
                      const match = message.content.match(POST_SHARE_REGEX);
                      const postId = match[1];
                      const preview = previewMap[postId];
                      return (
                        <div className="mt-2">
                          <SharedPost
                            postId={postId}
                            preview={preview}
                            onPostClick={(postId) => setOpenPostId(postId)}
                          />
                          {/* Timestamp for share post */}
                          <div
                            className={`mt-2 flex items-center gap-2 ${isCurrentUser ? 'justify-between' : 'justify-end'}`}
                          >
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </div>

                            {shouldShowStatus && isCurrentUser && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <span className="text-lg text-green-400">
                                  <CheckCheck className="h-4 w-4" />
                                </span>
                                <span>Sent</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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
