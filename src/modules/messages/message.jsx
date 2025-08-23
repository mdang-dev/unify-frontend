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
import { Smile, Send, Plus, Reply, Search, X } from 'lucide-react';
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
import InstagramTypingIndicator, { MinimalTypingIndicator } from '@/src/components/ui/instagram-typing-indicator';
import TypingMessageEffect, { InlineTypingEffect } from '@/src/components/ui/typing-message-effect';

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
  
  // Reply functionality state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  
  // Search functionality state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Track dropdown position for dragging - Start at top-right below search icon
  const [dropdownPosition, setDropdownPosition] = useState({ x: 500, y: 60 });
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  
  // Track if user is starting to drag
  const [isStartingDrag, setIsStartingDrag] = useState(false);
  
  // Get chat data early so functions can access it
  const { 
    chatMessages, 
    sendMessage, 
    chatList, 
    isLoadingChatList, 
    chatListError,
    isLoadingMessages,
    messagesError,
    sendError,
    refreshMessages,
    // Presence and typing functionality
    getUserStatus,
    isUserTyping,
    isAnyoneTypingToMe,
    getAllTypingUsers,
    handleTyping,
    stopTyping,
    userStatuses,
    typingUsers,
    requestOnlineUsersStatus
  } = useChat(
    user,
    chatPartner
  );
  
  // Function to reset dropdown position to below search button
  const resetDropdownPosition = useCallback(() => {
    if (searchButtonRef.current) {
      const rect = searchButtonRef.current.getBoundingClientRect();
      const dropdownX = rect.left - 200; // Center dropdown on button
      const dropdownY = rect.bottom + 10; // 10px below button
      setDropdownPosition({ x: dropdownX, y: dropdownY });
    } else {
      // Fallback to default position if button not found
      setDropdownPosition({ x: 500, y: 60 });
    }
  }, []);

  // Function to close search dropdown with delay
  const closeSearchDropdown = useCallback(() => {
    // Add a small delay to prevent immediate closure during drag operations
    setTimeout(() => {
      setShowSearchDropdown(false);
      setMessageSearchQuery('');
      setSearchResults([]);
      setSelectedResultIndex(0);
      resetDropdownPosition();
    }, 150); // 150ms delay
  }, [resetDropdownPosition]);

  // Function to handle dropdown close
  const handleDropdownClose = useCallback(() => {
    closeSearchDropdown();
  }, [closeSearchDropdown]);

  // Search functionality
  const handleSearch = useCallback(async () => {
    if (!messageSearchQuery.trim() || !chatPartner) {
      setSearchResults([]);
      setSelectedResultIndex(0);
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedResultIndex(0);

    try {
      const results = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(
            chatMessages
              .filter((msg) => {
                const isOwnMessage = msg.sender === user?.id;
                const isChatPartnerMessage = msg.sender === chatPartner;
                const isTextMessage = msg.content && typeof msg.content === 'string';
                const isFileMessage = msg.files && msg.files.length > 0;

                if (!isTextMessage && !isFileMessage) return false;

                if (isTextMessage) {
                  return msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase());
                }

                if (isFileMessage) {
                  return msg.files.some((file) => {
                    const fileName = file.name.toLowerCase();
                    return fileName.includes(messageSearchQuery.toLowerCase());
                  });
                }
                return false;
              })
              .map((msg) => ({
                id: msg.id,
                sender: msg.sender,
                content: msg.content,
                timestamp: msg.timestamp,
                files: msg.files,
                index: chatMessages.findIndex(m => m.id === msg.id) // Add index for scrolling
              }))
          );
        }, 500); // Simulate search delay
      });
      setSearchResults(results);
      setSelectedResultIndex(0);
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchResults([]);
      setSelectedResultIndex(0);
    } finally {
      setIsSearching(false);
    }
  }, [messageSearchQuery, chatMessages, user?.id, chatPartner]);

  // Function to scroll to message in chat
  const scrollToMessage = useCallback((messageIndex) => {
    const messageElements = document.querySelectorAll('.message-item');
    if (messageElements[messageIndex]) {
      messageElements[messageIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Add highlight effect
      messageElements[messageIndex].classList.add('bg-gray-100', 'dark:bg-gray-800');
      setTimeout(() => {
        messageElements[messageIndex].classList.remove('bg-gray-100', 'dark:bg-gray-800');
      }, 2000);
    }
  }, []);

  // Handle arrow navigation for search results
  const handleSearchNavigation = useCallback((direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = selectedResultIndex > 0 ? selectedResultIndex - 1 : searchResults.length - 1;
    } else {
      newIndex = selectedResultIndex < searchResults.length - 1 ? selectedResultIndex + 1 : 0;
    }
    
    setSelectedResultIndex(newIndex);
    
    // Scroll to the selected message
    const selectedResult = searchResults[newIndex];
    if (selectedResult && selectedResult.index !== undefined) {
      scrollToMessage(selectedResult.index);
    }
  }, [searchResults, selectedResultIndex, scrollToMessage]);
  
  const [opChat, setOpChat] = useState({
    userId: '',
    avatar: '',
    fullname: '',
    username: '',
  });
  
  // Reply functionality handlers
  const handleReplyClick = (message) => {
    setReplyingTo(message);
    setReplyInput('');
    // Focus on the input after setting reply state
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder*="Message"]');
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyInput('');
  };

  const handleSendReply = () => {
    if (!replyingTo || (!replyInput.trim() && files.length === 0)) return;
    
    // Stop typing immediately when sending reply
    if (chatPartner) {
      stopTyping(chatPartner);
    }
    
    // Send the reply message with the replyToMessageId
    const replyMessage = replyInput.trim();
    const replyFiles = files;
    
    // Clear reply state
    setReplyingTo(null);
    setReplyInput('');
    setFiles([]);
    
    // Send message with reply context
    if (sendMessage) {
      sendMessage(replyMessage, replyFiles, chatPartner, replyingTo.id);
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
  
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

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
  const typingIndicatorRef = useRef(null);
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

  // Fetch initial user statuses when chat list loads
  useEffect(() => {
    if (chatList && chatList.length > 0 && user?.id) {
      // Extract unique user IDs from chat list
      const userIds = [...new Set(chatList.map(chat => chat.userId).filter(Boolean))];
      
      // Request online users status to get current status of all users
      // This ensures bidirectional visibility of user statuses
      requestOnlineUsersStatus();
    }
  }, [chatList, user?.id, requestOnlineUsersStatus]);

  // Debug typing states in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && chatPartner) {
      console.log('Current typing states:', getAllTypingUsers());
      console.log('Is anyone typing to me:', isAnyoneTypingToMe());
      console.log('Is current partner typing to me:', isUserTyping(chatPartner, user?.id));
    }
  }, [chatPartner, user?.id, getAllTypingUsers, isAnyoneTypingToMe, isUserTyping]);

  // Auto-scroll to typing indicator when it appears
  useEffect(() => {
    if (isUserTyping(opChat?.userId, user?.id) && typingIndicatorRef.current) {
      // Small delay to ensure the typing indicator is fully rendered
      setTimeout(() => {
        typingIndicatorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    } else if (!isUserTyping(opChat?.userId, user?.id) && messagesEndRef.current) {
      // When typing stops, scroll back to the end of messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  }, [isUserTyping, opChat?.userId, user?.id]);

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
      // Stop typing immediately when sending message
      if (chatPartner) {
        stopTyping(chatPartner);
      }
      
      // Clear input immediately for instant feedback
      setNewMessage('');
      setFiles([]);
      
      // Send message instantly with no delays
      // If replying to a message, include the replyToMessageId
      if (replyingTo) {
        sendMessage(newMessage, files, chatPartner, replyingTo.id);
        setReplyingTo(null);
        setReplyInput('');
      } else {
        sendMessage(newMessage, files, chatPartner);
      }
      
      // ✅ REMOVED: Toast notification for successful message sending
      // Users will see the message appear instantly instead
    }
  }, [chatPartner, newMessage, files, sendMessage, t, replyingTo, stopTyping]);

  // Keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Enter: Send message
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage();
      }
      
      // Escape: Clear files, close picker, or cancel reply
      if (event.key === 'Escape') {
        if (replyingTo) {
          handleCancelReply();
        } else if (files.length > 0) {
          setFiles([]);
          // ✅ REMOVED: Toast notification for files cleared via keyboard
        }
        if (showPicker) {
          setShowPicker(false);
        }
      }
      
      // Enter: Send reply if replying to a message
      if (event.key === 'Enter' && replyingTo && (replyInput.trim() || files.length > 0)) {
        event.preventDefault();
        handleSendReply();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [files, showPicker, handleSendMessage, replyingTo, replyInput]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if user is starting to drag
      if (isStartingDrag) {
        return;
      }
      
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
  }, [showPicker, isStartingDrag]);

  // Mouse event handlers for dragging
  useEffect(() => {
    // DIRECTIVE: SEARCH DROPDOWN DRAGGING SYSTEM - SMART VIEWPORT BOUNDARIES
    // 
    // BEHAVIOR:
    // 1. VIEWPORT-CONSTRAINED: Dropdown stays within viewport for better UX
    // 2. SMART LEFT PROTECTION: Respects sidebar and chat list boundaries
    // 3. VISIBILITY PROTECTION: Never goes off-screen or gets hidden
    // 4. SMOOTH FOLLOWING: Dropdown sticks to mouse pointer during drag
    // 5. INTELLIGENT BOUNDARIES: Smart positioning that respects UI layout
    //
    // CONSTRAINTS:
    // - Left: Don't go past chat list (respects sidebar + chat list + 20px margin)
    // - Right: Keep dropdown visible on right edge (20px margin)
    // - Top: Keep dropdown visible on top edge (20px margin)
    // - Bottom: Keep dropdown visible on bottom edge (20px margin)
    //
    // USER EXPERIENCE:
    // - Smart dragging within viewport boundaries
    // - Respects sidebar and chat list layout
    // - Always visible and accessible
    // - Natural movement with intelligent constraints
    
    const handleMouseMove = (event) => {
      if (isDragging && dropdownRef.current) {
        // DIRECTIVE: Calculate new position based on mouse movement
        // This ensures the dropdown follows the mouse pointer smoothly
        const newX = event.clientX - dragOffset.x;
        const newY = event.clientY - dragOffset.y;
        
        // DIRECTIVE: Get viewport dimensions for boundary calculations
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // DIRECTIVE: Get dropdown dimensions for accurate boundary calculations
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const dropdownWidth = dropdownRect.width;
        const dropdownHeight = dropdownRect.height;
        
        // DIRECTIVE: VIEWPORT-CONSTRAINED DRAGGING - Smart boundaries for better UX
        // The dropdown can be dragged within the viewport with smart left-sidebar protection
        // This prevents going off-screen while allowing natural movement
        
        // Smart viewport boundaries: Keep dropdown visible and respect sidebar
        const sidebarWidth = 80; // Approximate width of left sidebar
    // Approximate width of chat list panel
        const leftBoundary = sidebarWidth + 20; // Don't go past chat list
        
        // Viewport boundaries with smart left protection
        const minX = leftBoundary; // Don't go past chat list (respect sidebar)
        const maxX = viewportWidth - dropdownWidth - 20; // Keep visible on right
        const minY = 20; // Keep visible on top
        const maxY = viewportHeight - dropdownHeight - 20; // Keep visible on bottom
        
        // Apply smart boundaries
        const boundedX = Math.max(minX, Math.min(maxX, newX));
        const boundedY = Math.max(minY, Math.min(maxY, newY));
        
        // Add visual feedback when near boundaries
        const isNearBoundary = 
          boundedX <= minX + 30 || 
          boundedX >= maxX - 30 || 
          boundedY <= minY + 30 || 
          boundedY >= maxY - 30;
        
        setDropdownPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Small delay to prevent accidental state changes during quick movements
      setTimeout(() => {
        setIsStartingDrag(false);
      }, 100);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Restore text selection and cursor
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, dragOffset]);

  // Trigger search when query changes
  useEffect(() => {
    if (messageSearchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300); // Debounce search by 300ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setSelectedResultIndex(0);
    }
  }, [messageSearchQuery, handleSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (!showSearchDropdown) {
          // Get search button position and position dropdown below it
          if (searchButtonRef.current) {
            const rect = searchButtonRef.current.getBoundingClientRect();
            const dropdownX = rect.left - 200; // Center dropdown on button
            const dropdownY = rect.bottom + 10; // 10px below button
            setDropdownPosition({ x: dropdownX, y: dropdownY });
          }
        }
        setShowSearchDropdown(!showSearchDropdown);
      }
      
      if (e.key === 'Escape' && showSearchDropdown) {
        handleDropdownClose();
      }
      
      if (showSearchDropdown && messageSearchQuery.trim() && searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleSearchNavigation('down');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleSearchNavigation('up');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearchDropdown, messageSearchQuery, searchResults, handleSearchNavigation]);

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
                    <div className="relative">
                      <Link href={`/others-profile/${chat?.username}`} className="hover:opacity-80 transition-opacity">
                        <img
                          src={chat?.avatar?.url || AvatarDefault?.src}
                          alt="Avatar"
                          className="h-12 w-12 rounded-full border-2 border-gray-500 dark:border-neutral-500 cursor-pointer"
                        />
                      </Link>
                      {/* Active Status Indicator - More Visible and Intuitive */}
                      <div className={`absolute top-[85%] right-[15%] transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        (() => {
                          const userStatus = getUserStatus(chat?.userId);
                          if (userStatus.active) {
                            return 'bg-green-500 shadow-lg'; // Online - with shadow for visibility
                          } else if (userStatus.lastActive) {
                            const lastActive = new Date(userStatus.lastActive);
                            const now = new Date();
                            const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                            
                            if (diffInMinutes < 5) return 'bg-yellow-500'; // Away (recently active)
                            else if (diffInMinutes < 30) return 'bg-orange-500'; // Busy
                            else return 'bg-gray-400'; // Offline
                          } else {
                            return 'bg-gray-400'; // Default offline
                          }
                        })()
                      }`}></div>
                    </div>
                    <div className="ml-4">
                      <h4 className="w-23 truncate text-sm font-medium">
                        {chat?.fullname || chat?.fullName || opChat?.fullname || t('UnknownUser')}
                      </h4>
                      <div className="w-60 truncate text-sm text-neutral-500 dark:text-gray-400">
                        {(() => {
                          // Check if user is typing to current user
                          if (isUserTyping(chat?.userId, user?.id)) {
                            return (
                              <div className="flex items-center">
                                <InlineTypingEffect
                                  isTyping={true}
                                  message="typing..."
                                  typingSpeed={30}
                                  className="text-blue-500 dark:text-blue-400 italic"
                                />
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-1">
                              {chat?.lastMessage ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {chat?.lastMessageSender === user?.id ? 'You' : 
                                     chat?.fullname || chat?.fullName || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                  <span className="truncate block text-sm text-gray-700 dark:text-gray-300">
                                    {chat?.lastMessage}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                  No messages yet
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {/* Status and Last Seen - More Intuitive Format */}
                      {(() => {
                        const userStatus = getUserStatus(chat?.userId);
                        if (userStatus.active) {
                          return (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Online
                              </span>
                            </div>
                          );
                        } else if (userStatus.lastActive) {
                          const lastActive = new Date(userStatus.lastActive);
                          const now = new Date();
                          const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                          const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
                          
                          let statusText = '';
                          if (diffInMinutes < 1) {
                            statusText = 'Just now';
                          } else if (diffInMinutes < 60) {
                            statusText = `${diffInMinutes}m ago`;
                          } else if (diffInHours < 24) {
                            statusText = `${diffInHours}h ago`;
                          } else if (diffInHours < 48) {
                            statusText = 'Yesterday';
                          } else {
                            statusText = lastActive.toLocaleDateString('vi-VN', {
                              month: 'short',
                              day: 'numeric'
                            });
                          }
                          
                          return (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {statusText}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
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
                  <div className="relative">
                    <Link href={`/others-profile/${opChat?.username}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={opChat?.avatar || AvatarDefault.src}
                        alt="Avatar user"
                        className="h-12 w-12 rounded-full border-2 border-gray-500 dark:border-neutral-700 cursor-pointer"
                      />
                    </Link>
                                          {/* Active Status Indicator - More Visible and Intuitive */}
                      <div className={`absolute top-[68%] right-[15%] transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        (() => {
                          const userStatus = getUserStatus(opChat?.userId);
                          if (userStatus.active) {
                            return 'bg-green-500 shadow-lg'; // Online - with shadow for visibility
                          } else if (userStatus.lastActive) {
                            const lastActive = new Date(userStatus.lastActive);
                            const now = new Date();
                            const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                            
                            if (diffInMinutes < 5) return 'bg-yellow-500'; // Away (recently active)
                            else if (diffInMinutes < 30) return 'bg-orange-500'; // Busy
                            else return 'bg-gray-400'; // Offline
                          }
                          return 'bg-gray-400'; // Default offline
                        })()
                      }`}></div>
                  </div>
                  <div className="ml-5">
                    <h4 className="w-60 truncate text-sm font-medium dark:text-white">
                      {opChat?.fullname || t('Fullname')}
                    </h4>
                    <div className="flex flex-col gap-1">
                      <p className="w-40 truncate text-sm text-gray-500 dark:text-neutral-400">
                        {opChat?.username || t('Username')}
                      </p>
                      {/* Status and Last Seen - Consolidated and More Intuitive */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          (() => {
                            const userStatus = getUserStatus(opChat?.userId);
                            if (userStatus.active) {
                              return 'bg-green-500'; // Online
                            } else if (userStatus.lastActive) {
                              const lastActive = new Date(userStatus.lastActive);
                              const now = new Date();
                              const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                              
                              if (diffInMinutes < 5) return 'bg-yellow-500'; // Away (recently active)
                              else if (diffInMinutes < 30) return 'bg-orange-500'; // Busy
                              else return 'bg-gray-400'; // Offline
                            } else {
                              return 'bg-gray-400'; // Default offline
                            }
                          })()
                        }`}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {(() => {
                            const userStatus = getUserStatus(opChat?.userId);
                            if (userStatus.active) {
                              return 'Online now';
                            } else if (userStatus.lastActive) {
                              const lastActive = new Date(userStatus.lastActive);
                              const now = new Date();
                              const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                              const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
                              
                              if (diffInMinutes < 1) {
                                return 'Just now';
                              } else if (diffInMinutes < 60) {
                                return `${diffInMinutes}m ago`;
                              } else if (diffInHours < 24) {
                                return `${diffInHours}h ago`;
                              } else if (diffInHours < 48) {
                                return 'Yesterday';
                              } else {
                                return lastActive.toLocaleDateString('vi-VN', {
                                  month: 'short',
                                  day: 'numeric'
                                });
                              }
                            } else {
                              return 'Offline';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-1/3 items-center justify-end text-2xl">
                  {isUploading && (
                    <div className="mr-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
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
                  
                  {/* Message Search Button */}
                  <div className="relative">
                    <button
                      ref={searchButtonRef}
                      title="Search Messages (Ctrl+K)"
                      onClick={() => {
                        if (!showSearchDropdown) {
                          // Get search button position and position dropdown below it
                          if (searchButtonRef.current) {
                            const rect = searchButtonRef.current.getBoundingClientRect();
                            const dropdownX = rect.left - 200; // Center dropdown on button
                            const dropdownY = rect.bottom + 20; // 10px below button
                            setDropdownPosition({ x: dropdownX, y: dropdownY });
                          }
                        }
                        setShowSearchDropdown(!showSearchDropdown);
                      }}
                      className="mr-2 rounded-md p-2 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700"
                    >
                      <i className="fa-solid fa-magnifying-glass ark:text-zinc-100"></i>

                    </button>
                    

                    
                    {/* Search Dropdown */}
                    {showSearchDropdown && (
                      <div 
                        ref={dropdownRef}
                        className="search-dropdown fixed top-12 w-64 bg-white dark:bg-black rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 z-50"
                        style={{
                          left: `${dropdownPosition.x}px`,
                          top: `${dropdownPosition.y}px`
                        }}
                      >
                        {/* Drag Handle */}
                        {/* DIRECTIVE: DRAGGABLE SEARCH DROPDOWN
                            - CAN be dragged anywhere on the entire page/viewport
                            - CANNOT go too far out of viewport (90% visibility minimum)
                            - Provides maximum positioning flexibility while maintaining strong accessibility
                            - Use the three-dot handle below to drag */}
                        <div 
                          className={`drag-handle p-3 border-b border-gray-200 dark:border-gray-800 cursor-move bg-gray-50 dark:bg-gray-900 rounded-t-lg transition-all duration-200 select-none ${
                            isDragging 
                              ? 'bg-gray-100 dark:bg-gray-800 shadow-lg ring-2 ring-gray-300 dark:ring-gray-600' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setIsStartingDrag(true);
                            
                            if (dropdownRef.current) {
                              // Calculate offset from mouse to the dropdown's current position
                              // This ensures the dropdown sticks to the mouse pointer
                              const offsetX = e.clientX - dropdownPosition.x;
                              const offsetY = e.clientY - dropdownPosition.y;
                              
                              setDragOffset({
                                x: offsetX,
                                y: offsetY
                              });
                              
                              setIsDragging(true);
                            }
                          }}
                          onMouseEnter={() => {
                            // Prevent closing when hovering over drag handle
                            if (isStartingDrag) {
                              return;
                            }
                          }}
                          title="Drag to move search dropdown"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full transition-colors ${
                                isDragging ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                              }`}></div>
                              <div className={`w-2 h-2 rounded-full transition-colors ${
                                isDragging ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                              }`}></div>
                              <div className={`w-2 h-2 rounded-full transition-colors ${
                                isDragging ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                              }`}></div>
                            </div>
                            <div className="flex-1 ml-3">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Search Messages</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Search in your chat with {opChat?.fullname || 'this user'}
                              </p>
                            </div>
                            <button
                              onClick={handleDropdownClose}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-600 dark:text-gray-400" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder="Search in this conversation..."
                              value={messageSearchQuery}
                              onChange={(e) => setMessageSearchQuery(e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-all duration-200"
                              autoFocus
                            />
                            {messageSearchQuery && (
                                                              <button
                                  onClick={() => setMessageSearchQuery('')}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                            )}
                          </div>
                          
                          {/* Search Results Counter and Navigation */}
                          {messageSearchQuery.trim() && searchResults.length > 0 && (
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedResultIndex + 1} of {searchResults.length} matches
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSearchNavigation('up')}
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                  title="Previous result"
                                >
                                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleSearchNavigation('down')}
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                  title="Next result"
                                >
                                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Status Messages */}
                          {messageSearchQuery.trim() && searchResults.length === 0 && !isSearching && (
                            <div className="mt-3 text-center text-gray-500 dark:text-gray-400">
                              <Search className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                              <p className="text-xs">No messages found</p>
                              <p className="text-xs">Try different keywords</p>
                            </div>
                          )}
                          
                          {/* Loading State */}
                          {isSearching && (
                            <div className="mt-3 text-center text-gray-500 dark:text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-1"></div>
                              <p className="text-xs">Searching messages...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                        className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
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
                  <>
                    <Message
                      messages={chatMessages}
                      messagesEndRef={messagesEndRef}
                      avatar={opChat.avatar || AvatarDefault.src}
                      onReply={handleReplyClick}
                    />
                    
                    {/* Typing Indicator - Below Messages */}
                    {isUserTyping(opChat?.userId, user?.id) && (
                      <div className="px-4 py-2" ref={typingIndicatorRef}>
                        <div className="flex items-start">
                          {/* Avatar */}
                          <div className="flex-shrink-0 mr-3">
                            <img
                              src={opChat?.avatar || AvatarDefault.src}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full border border-gray-300 dark:border-gray-600"
                            />
                          </div>
                          
                          {/* Typing Effect */}
                          <div className="flex-1">
                            <TypingMessageEffect
                              isTyping={true}
                              message="Typing a message..."
                              variant="default"
                              typingSpeed={50}
                              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
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

                {/* Reply indicator */}
                {replyingTo && (
                  <div className="absolute bottom-24 left-0 right-0 mx-3 rounded-lg bg-gray-50 dark:bg-gray-900 p-3 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {getReplyContext(replyingTo)}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[300px]">
                            {replyingTo.content ? 
                              (replyingTo.content.length > 60 ? 
                                replyingTo.content.substring(0, 60) + '...' : 
                                replyingTo.content
                              ) : 
                              'File message'
                            }
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelReply}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Cancel reply"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex w-full items-center justify-center rounded-3xl border border-zinc-300 p-3 text-black dark:border-neutral-700 dark:text-white">
                  {user?.avatar?.url && (
                    <Link href={`/others-profile/${user?.username}`} className="hover:opacity-80 transition-opacity">
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

                  <div className="flex-grow relative">
                    <input
                      type="text"
                      placeholder={replyingTo ? `${getReplyContext(replyingTo)}: ${replyingTo.content ? (replyingTo.content.length > 30 ? replyingTo.content.substring(0, 30) + '...' : replyingTo.content) : 'File message'}` : t('Message')}
                      className={`w-full rounded-3xl border border-zinc-300 px-4 py-2 text-black placeholder-zinc-400 focus:outline-none dark:border-neutral-700 dark:bg-black dark:text-white ${replyingTo ? 'pl-10' : ''}`}
                      value={replyingTo ? replyInput : newMessage}
                      onChange={(e) => {
                        if (replyingTo) {
                          setReplyInput(e.target.value);
                        } else {
                          setNewMessage(e.target.value);
                        }
                        
                        // Send typing event when user types (only if not empty)
                        if (chatPartner && e.target.value.trim()) {
                          handleTyping(chatPartner, true);
                        } else if (chatPartner && !e.target.value.trim()) {
                          // Stop typing if input is empty
                          stopTyping(chatPartner);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (replyingTo && (replyInput.trim() || files.length > 0)) {
                            e.preventDefault();
                            handleSendReply();
                          } else if (!replyingTo && newMessage.trim()) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }
                      }}
                      onBlur={() => {
                        // Stop typing when input loses focus
                        if (chatPartner) {
                          stopTyping(chatPartner);
                        }
                      }}
                    />
                    {replyingTo && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

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
                        onEmojiClick={(emojiObject) => {
                          if (replyingTo) {
                            setReplyInput(replyInput + emojiObject.emoji);
                          } else {
                            setNewMessage(newMessage + emojiObject.emoji);
                          }
                        }}
                      />
                    </div>
                  )}
                  {(newMessage.trim() || files.length > 0 || (replyingTo && (replyInput.trim() || files.length > 0))) && (
                    <button
                      onClick={replyingTo ? handleSendReply : handleSendMessage}
                      className="ml-2 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500 transition-all duration-200 hover:scale-105 active:scale-95"
                      title={replyingTo ? "Send reply" : "Send message"}
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
