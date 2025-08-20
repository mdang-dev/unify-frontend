'use client';

import { Input } from '@/src/components/ui/input';
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFileAudio,
  FaFileAlt,
} from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import Message from './_components/message';
import MessageSkeleton from './_components/message-skeleton';
import ChatListSkeleton from './_components/chat-list-skeleton';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/src/hooks/use-debounce';
import Picker from 'emoji-picker-react';
import { Smile, Send, Plus } from 'lucide-react';
import { useChat } from '@/src/hooks/use-chat';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AvatarDefault from '@/public/images/unify_icon_2.png';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { callCommandApi } from '@/src/apis/call/command/call.command.api';
import { addToast } from '@heroui/react';
import FileUploadProgress from './_components/file-upload-progress';
import { optimizeImage } from '@/src/utils/image-optimization.util';
import { toast } from 'sonner';

 const Messages = () => {
  const t = useTranslations('Messages');
  const user = useAuthStore((s) => s.user);
  const [chatPartner, setChatPartner] = useState(null);

  // ✅ PRODUCTION FIX: Add loading state to handle user hydration
  const [isUserHydrated, setIsUserHydrated] = useState(false);

  // ✅ PRODUCTION FIX: Ensure user is hydrated before proceeding
  useEffect(() => {
    if (user?.id) {
      setIsUserHydrated(true);
    } else {
      setIsUserHydrated(false);
    }
  }, [user]);
  const [opChat, setOpChat] = useState({
    userId: '',
    avatar: '',
    fullname: '',
    username: '',
  });
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { 
    chatMessages, 
    sendMessage, 
    chatList, 
    isLoadingChatList, 
    chatListError,
    isLoadingMessages,
    messagesError,
    sendError,
    refreshMessages
  } = useChat(
    user,
    chatPartner
  );

  // Silent chat list updates - only log errors

  // ✅ REAL-TIME: Handle chat list updates
  const handleChatListUpdate = (updatedChatList) => {
    // React Query cache is automatically updated by useChat hook
  };

  // Retry functionality removed for simplified chat
  const [newMessage, setNewMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { mutate: createCall } = useMutation({
    mutationFn: ({ callerId, calleeId, video }) =>
      callCommandApi.createCall(callerId, calleeId, video),
  });

  const MAX_FILE_SIZE_MB = 50;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const fileIcons = {
    'application/pdf': <FaFilePdf className="text-4xl text-red-500" />,
    'application/msword': <FaFileWord className="text-4xl text-blue-500" />,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (
      <FaFileWord className="text-4xl text-blue-500" />
    ),
    'application/vnd.ms-excel': <FaFileExcel className="text-4xl text-green-500" />,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (
      <FaFileExcel className="text-4xl text-green-500" />
    ),
    'application/zip': <FaFileArchive className="text-4xl text-yellow-500" />,
    'application/x-rar-compressed': <FaFileArchive className="text-4xl text-yellow-500" />,
    'audio/mpeg': <FaFileAudio className="text-4xl text-purple-500" />,
    'audio/wav': <FaFileAudio className="text-4xl text-purple-500" />,
    'text/plain': <FaFileAlt className="text-4xl text-gray-500" />,
  };

  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [isUploading, setIsUploading] = useState(false); // Loading state for file upload
  
  // ✅ PERFORMANCE: Debounced search to prevent excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ✅ PERFORMANCE: Memoized filtered chat list to prevent unnecessary re-renders
  const filteredChatList = useMemo(() => {
    try {
      return (chatList || [])?.filter((chat) => {
        // Skip invalid chat objects silently
        if (!chat || typeof chat !== 'object') {
          return false;
        }

        const fullname = chat?.fullname || chat?.fullName || '';
        const username = chat?.username || '';
        const searchLower = debouncedSearchQuery.toLowerCase();

        return (
          fullname?.toLowerCase().includes(searchLower) ||
          username?.toLowerCase().includes(searchLower)
        );
      });
    } catch (error) {
      return [];
    }
  }, [chatList, debouncedSearchQuery]);

  useEffect(() => {
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const avatar = searchParams.get('avatar');
    const fullname = searchParams.get('fullname');

    if (userId && username) {
      // Cập nhật opChat với thông tin từ query parameters
      setOpChat({
        userId,
        avatar: avatar || AvatarDefault?.src,
        fullname: fullname || 'Fullname',
        username,
      });
      setChatPartner(userId); // Cập nhật chatPartner để load tin nhắn
    }
  }, [searchParams]);

  //   useEffect(() => {
  //     if (chatPartner) {
  //       queryClient.invalidateQueries([QUERY_KEYS.MESSAGES, user?.id, chatPartner]);
  //     }
  //   }, [chatPartner]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [chatMessages]);

  // Show error toast when message sending fails
  useEffect(() => {
    if (sendError) {
      addToast({
        title: t('Error'),
        description: t('FailedToSendMessage'),
        timeout: 3000,
        color: 'danger',
      });
    }
  }, [sendError, t]);

  // ✅ PERFORMANCE: Optimized send message handler for maximum speed
  const handleSendMessage = useCallback(() => {
    if (!chatPartner) {
      addToast({
        title: t('Error'),
        description: t('ErrorSendingMessage'),
        timeout: 3000,
        color: 'danger',
      });
      return;
    }
    if (!sendMessage) {
      addToast({
        title: t('Error'),
        description: t('ChatSystemNotReady'),
        timeout: 3000,
        color: 'danger',
      });
      return;
    }
    if (newMessage || files.length > 0) {
      // Clear input immediately for instant feedback
      setNewMessage('');
      setFiles([]);
      
      // Send message instantly with no delays
      sendMessage(newMessage, files, chatPartner);
      
      // ✅ REMOVED: Toast notification for successful message sending
      // Users will see the message appear instantly instead
    }
  }, [chatPartner, newMessage, files, sendMessage, t]);

  // Keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Enter: Send message
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage();
      }
      
      // Escape: Clear files or close picker
      if (event.key === 'Escape') {
        if (files.length > 0) {
          setFiles([]);
          // ✅ REMOVED: Toast notification for files cleared via keyboard
        }
        if (showPicker) {
          setShowPicker(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [files, showPicker, handleSendMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const handleFileChange = async (event) => {
    const newFiles = Array.from(event.target.files);
    const maxFiles = 20;

    // Validate file count limit
    if (files.length + newFiles.length > maxFiles) {
      addToast({
        title: t('TooManyFiles'),
        description: t('MaxFilesAllowed', { max: maxFiles }),
        timeout: 3000,
        color: 'warning',
      });
      return;
    }

    setIsUploading(true);
    const validFiles = [];
    
    try {
      for (const file of newFiles) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          addToast({
            title: t('FileTooLarge'),
            description: t('FileExceedsSize', { filename: file.name, size: MAX_FILE_SIZE_MB }),
            timeout: 3000,
            color: 'warning',
          });
          continue;
        }

        let preview = null;
        
        // Generate preview based on file type
        if (file.type.startsWith('image/')) {
          preview = await generateImagePreview(file);
        } else if (file.type.startsWith('video/')) {
          preview = URL.createObjectURL(file);
        }

        validFiles.push({ file, preview });
      }

      // Add valid files to state
      if (validFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
        // ✅ REMOVED: Toast notification for files added
        // Users will see files appear in the UI instead
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsUploading(false);
    }
  };

  // Generate optimized image preview with error boundary
  const generateImagePreview = async (file) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        // Timeout for preview generation
        setTimeout(() => {
          // Handle timeout silently
        }, 5000);
        
        img.onload = () => {
          try {
            // Calculate optimal thumbnail dimensions
            const maxSize = 150;
            const aspectRatio = img.width / img.height;
            let width = maxSize;
            let height = maxSize;
            
            if (aspectRatio > 1) {
              height = maxSize / aspectRatio;
            } else {
              width = maxSize * aspectRatio;
            }
            
            // Create optimized thumbnail
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const preview = canvas.toDataURL(file.type, 0.8);
            resolve(preview);
          } catch (error) {
            // Handle canvas error silently
            resolve(URL.createObjectURL(file));
          }
        };
        
        img.onerror = () => {
          // Handle image load error silently
          resolve(URL.createObjectURL(file));
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      // Handle preview creation error silently
      return URL.createObjectURL(file);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    // ✅ REMOVED: Toast notification for files cleared
    // Users will see files disappear from the UI instead
  };

  const handlePreview = (fileObj) => {
    if (fileObj.preview) {
      window.open(fileObj.preview, '_blank');
    } else {
      toast.error(t('NoPreviewAvailable'));
    }
  };

  // ✅ PERFORMANCE: Memoized chat selection handler
  const handleChatSelect = useCallback((chat) => {
    if (process.env.NODE_ENV === 'development') {
      
    }

    if (!chat?.userId || typeof chat.userId !== 'string') {
      return;
    }

    setOpChat({
      userId: chat.userId,
      avatar: chat?.avatar?.url,
      fullname: chat?.fullname || chat?.fullName || 'Unknown User',
      username: chat?.username || 'unknown',
    });
    setChatPartner(chat.userId);

    // Force refetch messages for the new chat partner
    if (user?.id && chat.userId) {
      queryClient.invalidateQueries([QUERY_KEYS.CHAT_MESSAGES, user.id, chat.userId]);
    }


  }, [user?.id, queryClient]);

  const handleCall = () => {
    if (!user || !opChat) return;
    createCall(
      { callerId: user?.id, calleeId: opChat?.userId, video: false },
      {
        onSuccess: (data) => {
          window.open(`/call?room=${data.room}`, '_blank');
        },
        onError: () => {
          addToast({
            title: t('Error'),
            description: t('ErrorCalling'),
            timeout: 3000,
            color: 'danger',
          });
        },
      }
    );
  };

  const handleVideoCall = () => {
    if (!user || !opChat) return;
    createCall(
      { callerId: user?.id, calleeId: opChat?.userId, video: true },
      {
        onSuccess: (data) => {
          window.open(`/call?room=${data.room}`, '_blank');
        },
        onError: () => {
          addToast({
            title: t('Error'),
            description: t('ErrorCalling'),
            timeout: 3000,
            color: 'danger',
          });
        },
      }
    );
  };

  return (
    <div className="ml-auto">
      <div className="flex w-full">
        <div className="flex h-screen basis-1/3 flex-col">
          <div className="sticky top-0 z-10 border-r-1 px-4 py-3 shadow-md dark:border-r-neutral-700 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold dark:text-white">{t('Title')}</h1>
            </div>
            <div className="mb-2">
              <Input
                placeholder={t('Search')}
                className={`h-10 w-full border-gray-300 p-3 placeholder-gray-500 dark:border-neutral-600`}
                value={searchQuery} // Bind input to searchQuery state
                onChange={(e) => setSearchQuery(e.target.value)} // Update searchQuery on input change
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-scroll border-r-1 px-4 py-1 scrollbar-hide dark:border-r-neutral-700 dark:bg-black">
            {!isUserHydrated ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-lg text-gray-500 dark:text-neutral-400">{t('LoadingUser')}</p>
              </div>
            ) : isLoadingChatList ? (
              <ChatListSkeleton />
            ) : !chatList ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-lg text-gray-500 dark:text-neutral-400">
                  {chatListError ? t('ErrorLoadingChats') : t('LoadingChats')}
                </p>
              </div>
            ) : filteredChatList?.length > 0 ? (
              filteredChatList.map((chat, index) => (
                <div
                  key={chat?.userId || index}
                  className={`mt-3 flex w-full max-w-md cursor-pointer items-center justify-between rounded-lg p-3 transition duration-200 ease-in-out ${
                    chat?.userId === chatPartner
                      ? 'bg-gray-200 shadow-md ring-1 ring-white dark:bg-neutral-800 dark:ring-neutral-600'
                      : 'hover:bg-gray-300 dark:hover:bg-neutral-700'
                  } text-black dark:text-white`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-center">
                    <Link href={`/profile/${chat?.username}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={chat?.avatar?.url || AvatarDefault?.src}
                        alt="Avatar"
                        className="h-12 w-12 rounded-full border-2 border-gray-500 dark:border-neutral-500 cursor-pointer"
                      />
                    </Link>
                    <div className="ml-4">
                      <h4 className="w-23 truncate text-sm font-medium">
                        {chat?.fullname || chat?.fullName || opChat?.fullname || t('UnknownUser')}
                      </h4>
                      <p className="w-60 truncate text-sm text-neutral-500 dark:text-gray-400">
                        {chat?.lastMessage}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {chat?.lastUpdated
                      ? new Date(chat.lastUpdated).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-lg text-gray-500 dark:text-neutral-400">
                  {t('LetsStartChat')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="ml-5 mr-5 h-screen basis-2/3">
          {!opChat?.userId ? (
            <div className="h-full w-full">
                          <div className="flex h-full items-center justify-center">
              <h1 className="text-lg text-gray-500 dark:text-neutral-400">
                {t('SelectChatToStart')}
              </h1>
            </div>
            </div>
          ) : (
            <>
              <div className="flex w-full p-3">
                <div className="flex grow">
                  <Link href={`/profile/${opChat?.username}`} className="hover:opacity-80 transition-opacity">
                    <img
                      src={opChat?.avatar || AvatarDefault.src}
                      alt="Avatar user"
                      className="h-12 w-12 rounded-full border-2 border-gray-500 dark:border-neutral-700 cursor-pointer"
                    />
                  </Link>
                  <div className="ml-5">
                    <h4 className="w-60 truncate text-sm font-medium">
                      {opChat?.fullname || t('Fullname')}
                    </h4>
                    <p className="w-40 truncate text-sm text-gray-500 dark:text-neutral-400">
                      {opChat?.username || t('Username')}
                    </p>
                  </div>
                </div>
                <div className="flex w-1/3 items-center justify-end text-2xl">
                  {isUploading && (
                    <div className="mr-2 flex items-center text-sm text-blue-500">
                      <span>⏳ Processing files...</span>
                    </div>
                  )}
                  <button
                    title={t('Call')}
                    onClick={handleCall}
                    className="mr-2 rounded-md p-2 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700"
                  >
                    <i className="fa-solid fa-phone dark:text-zinc-100"></i>
                  </button>
                  <button
                    title={t('VideoCall')}
                    onClick={handleVideoCall}
                    className="mr-2 rounded-md p-2 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700"
                  >
                    <i className="fa-solid fa-video dark:text-zinc-100"></i>
                  </button>
                  <button
                    title="Video Call"
                    className="mr-2 rounded-md p-2 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700"
                  >
                    <i className="fa-solid fa-ellipsis-vertical dark:text-zinc-100"></i>
                  </button>
                </div>
              </div>
              <hr className="dark:border-neutral-700" />

              <div className="h-[80%] overflow-y-scroll scrollbar-hide">
                {!chatPartner ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-neutral-400 mb-2">Select a chat to start messaging</p>
                      <p className="text-sm text-gray-400">Choose someone from the chat list</p>
                    </div>
                  </div>
                ) : isLoadingMessages ? (
                  <MessageSkeleton />
                ) : messagesError ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-red-500 dark:text-red-400 mb-2">
                        {messagesError?.message || t('ErrorLoadingMessages') || 'Error loading messages'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {messagesError?.response?.data?.message || 'Please check your connection and try again'}
                      </p>
                      <button 
                        onClick={() => refreshMessages()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {t('Retry') || 'Retry'}
                      </button>
                    </div>
                  </div>
                ) : chatMessages?.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-neutral-400 mb-2">No messages yet</p>
                      <p className="text-sm text-gray-400">Start a conversation!</p>
                    </div>
                  </div>
                ) : (
                  <Message
                    messages={chatMessages}
                    messagesEndRef={messagesEndRef}
                    avatar={opChat.avatar || AvatarDefault.src}
                  />
                )}
              </div>

              <div className={`relative w-full`}>
                {files.length > 0 && (
                  <div className="absolute bottom-24 left-0 right-0 mx-3 rounded-lg bg-neutral-800 p-3 shadow-lg dark:bg-neutral-800">
                    <FileUploadProgress
                      files={files}
                      onRemove={handleRemoveFile}
                      onClearAll={handleClearAllFiles}
                      showFileInfo={true}
                      className="max-h-54 overflow-y-auto"
                    />
                  </div>
                )}

                <div className="flex w-full items-center justify-center rounded-3xl border border-zinc-300 p-3 text-black dark:border-neutral-700 dark:text-white">
                  {user?.avatar?.url && (
                    <Link href={`/profile/${user?.username}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={user?.avatar.url}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full border-2 border-gray-500 dark:border-neutral-700 cursor-pointer"
                      />
                    </Link>
                  )}

                  <button
                    onClick={() => document.getElementById('chatFileInput').click()}
                    className="ml-3 mr-3 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500"
                  >
                    <Plus size={28} />
                  </button>
                  <input
                    type="file"
                    id="chatFileInput"
                    className="hidden"
                    multiple
                    accept="*/*"
                    onChange={handleFileChange}
                  />

                  <input
                    type="text"
                    placeholder={t('Message')}
                    className="flex-grow rounded-3xl border border-zinc-300 px-4 py-2 text-black placeholder-zinc-400 focus:outline-none dark:border-neutral-700 dark:bg-black dark:text-white"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="ml-2 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500"
                  >
                    <Smile size={28} />
                  </button>

                  {showPicker && (
                    <div ref={pickerRef} className="absolute bottom-20 right-14 z-50">
                      <Picker
                        onEmojiClick={(emojiObject) =>
                          setNewMessage(newMessage + emojiObject.emoji)
                        }
                      />
                    </div>
                  )}
                  {(newMessage.trim() || files.length > 0) && (
                    <button
                      onClick={handleSendMessage}
                      className="ml-2 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Send size={30} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
