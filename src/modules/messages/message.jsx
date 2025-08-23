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
    <div className="w-full max-w-full overflow-hidden min-h-screen">
      <div className="flex w-full h-screen max-h-screen">
        {/* Left Sidebar - Chat List - Smaller for large devices */}
        <div className="flex h-full w-full max-w-[280px] flex-col flex-shrink-0 border-r border-gray-200 dark:border-neutral-700 sm:max-w-[300px] md:max-w-[320px] lg:max-w-[340px] xl:max-w-[360px]">
          <div className="sticky top-0 z-10 border-b border-gray-200 px-2 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:px-3 md:px-3 lg:px-4">
            <div className="mb-2 flex items-center justify-between sm:mb-3 md:mb-3">
              <h1 className="text-base font-bold dark:text-white sm:text-lg md:text-lg lg:text-xl">{t('Title')}</h1>
            </div>
            <div className="mb-2 sm:mb-3">
              <Input
                placeholder={t('Search')}
                className="h-8 w-full border-gray-300 p-1.5 placeholder-gray-500 dark:border-neutral-600 text-sm sm:h-9 sm:p-2 sm:text-base md:h-9 md:p-2 lg:h-10 lg:p-2.5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List - Smaller spacing for large devices */}
          <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-hide dark:border-neutral-700 dark:bg-black sm:px-3 sm:py-2 md:px-3 lg:px-4">
            {!isUserHydrated ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-base text-gray-500 dark:text-neutral-400 md:text-lg">{t('LoadingUser')}</p>
              </div>
            ) : isLoadingChatList ? (
              <ChatListSkeleton />
            ) : !chatList ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-base text-gray-500 dark:text-neutral-400 md:text-lg">
                  {chatListError ? t('ErrorLoadingChats') : t('LoadingChats')}
                </p>
              </div>
            ) : filteredChatList?.length > 0 ? (
              filteredChatList.map((chat, index) => (
                <div
                  key={chat?.userId || index}
                  className={`mt-1 flex w-full max-w-full cursor-pointer items-center justify-between rounded-lg p-2 transition duration-200 ease-in-out sm:mt-2 sm:rounded-xl sm:p-3 md:mt-2 md:p-3 ${
                    chat?.userId === chatPartner
                      ? 'bg-gray-200 shadow-md ring-1 ring-white dark:bg-neutral-800 dark:ring-neutral-600'
                      : 'hover:bg-gray-300 dark:hover:bg-neutral-700'
                  } text-black dark:text-white`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <Link href={`/others-profile/${chat?.username}`} className="hover:opacity-80 transition-opacity">
                        <img
                          src={chat?.avatar?.url || AvatarDefault?.src}
                          alt="Avatar"
                          className="h-9 w-9 rounded-full border-2 border-gray-500 dark:border-neutral-500 cursor-pointer sm:h-10 sm:w-10 md:h-10 md:w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12"
                        />
                      </Link>
                      {/* Active Status Indicator - Smaller for large devices */}
                      <div className={`absolute top-[85%] right-[12%] transform translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white dark:border-gray-800 sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 ${
                        (() => {
                          const userStatus = getUserStatus(chat?.userId);
                          if (userStatus.active) {
                            return 'bg-green-500 shadow-lg';
                          } else if (userStatus.lastActive) {
                            const lastActive = new Date(userStatus.lastActive);
                            const now = new Date();
                            const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                            
                            if (diffInMinutes < 5) return 'bg-yellow-500';
                            else if (diffInMinutes < 30) return 'bg-orange-500';
                            else return 'bg-gray-400';
                          } else {
                            return 'bg-gray-400';
                          }
                        })()
                      }`}></div>
                    </div>
                    <div className="ml-2 min-w-0 flex-1 sm:ml-3 md:ml-3 lg:ml-4">
                      <h4 className="truncate text-xs font-medium sm:text-sm md:text-sm lg:text-base">
                        {chat?.fullname || chat?.fullName || opChat?.fullname || t('UnknownUser')}
                      </h4>
                      <div className="min-w-0 truncate text-xs text-neutral-500 dark:text-gray-400 sm:text-sm mt-0.5 sm:mt-1">
                        {(() => {
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
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              {chat?.lastMessage ? (
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                    {chat?.lastMessageSender === user?.id ? 'You' : 
                                     chat?.fullname || chat?.fullName || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                                  <span className="truncate block text-xs text-gray-700 dark:text-gray-300 sm:text-sm max-w-[100px] sm:max-w-[120px] md:max-w-[140px] lg:max-w-[160px] xl:max-w-[180px]">
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
                      {/* Status and Last Seen - Smaller for large devices */}
                      {(() => {
                        const userStatus = getUserStatus(chat?.userId);
                        if (userStatus.active) {
                          return (
                            <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 sm:w-2 sm:h-2 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5"></div>
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
                            <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 sm:w-2 sm:h-2 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5"></div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px] sm:max-w-[90px] md:max-w-[100px] lg:max-w-[120px] xl:max-w-[140px]">
                                {statusText}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2 sm:ml-3 md:ml-3">
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
                <p className="text-base text-gray-500 dark:text-neutral-400 md:text-lg">
                  {t('LetsStartChat')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window - Better proportions and spacing */}
        <div className="flex-1 flex flex-col min-w-0 h-screen max-w-full">
          {!opChat?.userId ? (
            <div className="h-full w-full">
              <div className="flex h-full items-center justify-center">
                <h1 className="text-lg text-gray-500 dark:text-neutral-400 px-6 text-center max-w-md">
                  {t('SelectChatToStart')}
                </h1>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header - Smaller for large devices */}
              <div className="flex w-full p-2 border-b border-gray-200 dark:border-neutral-700 max-w-full sm:p-2 md:p-3 lg:p-3 lg:pl-7">
                <div className="flex grow min-w-0 max-w-full items-center">
                  <div className="relative flex-shrink-0">
                    <Link href={`/others-profile/${opChat?.username}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={opChat?.avatar || AvatarDefault.src}
                        alt="Avatar user"
                        className="h-8 w-8 rounded-full border-2 border-gray-500 dark:border-neutral-700 cursor-pointer sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12"
                      />
                    </Link>
                    {/* Active Status Indicator - Smaller for large devices */}
                    <div className={`absolute top-[70%] right-[12%] transform translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white dark:border-gray-800 sm:top-[75%] sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 ${
                      (() => {
                        const userStatus = getUserStatus(opChat?.userId);
                        if (userStatus.active) {
                          return 'bg-green-500 shadow-lg';
                        } else if (userStatus.lastActive) {
                          const lastActive = new Date(userStatus.lastActive);
                          const now = new Date();
                          const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                          
                          if (diffInMinutes < 5) return 'bg-yellow-500';
                          else if (diffInMinutes < 30) return 'bg-orange-500';
                          else return 'bg-gray-400';
                        }
                        return 'bg-gray-400';
                      })()
                    }`}></div>
                  </div>
                  <div className="ml-2 min-w-0 flex-1 sm:ml-3 md:ml-3 lg:ml-4 max-w-full">
                    <h4 className="truncate text-sm font-medium dark:text-white max-w-full sm:text-base md:text-base lg:text-lg">
                      {opChat?.fullname || t('Fullname')}
                    </h4>
                    <div className="flex flex-col gap-0.5 sm:gap-1 max-w-full mt-0.5 sm:mt-1">
                      <p className="truncate text-xs text-gray-500 dark:text-neutral-400 max-w-full sm:text-sm md:text-sm lg:text-base">
                        {opChat?.username || t('Username')}
                      </p>
                      {/* Status and Last Seen - Smaller for large devices */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full sm:w-2 sm:h-2 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 ${
                          (() => {
                            const userStatus = getUserStatus(opChat?.userId);
                            if (userStatus.active) {
                              return 'bg-green-500';
                            } else if (userStatus.lastActive) {
                              const lastActive = new Date(userStatus.lastActive);
                              const now = new Date();
                              const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
                              
                              if (diffInMinutes < 5) return 'bg-yellow-500';
                              else if (diffInMinutes < 30) return 'bg-orange-500';
                              else return 'bg-gray-400';
                            } else {
                              return 'bg-gray-400';
                            }
                          })()
                        }`}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate max-w-[100px] sm:max-w-[110px] md:max-w-[120px] lg:max-w-[150px] xl:max-w-[180px]">
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
                {/* Action Buttons - Smaller for large devices */}
                <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2 text-base sm:text-lg md:text-lg lg:text-xl ml-2 sm:ml-3">
                  {isUploading && (
                    <div className="mr-1 flex items-center text-xs text-gray-600 dark:text-gray-400 sm:mr-2 md:mr-2 md:text-sm">
                      <span className="hidden sm:inline">⏳ Processing files...</span>
                      <span className="sm:hidden">⏳</span>
                    </div>
                  )}
                  <button
                    title={t('Call')}
                    onClick={handleCall}
                    className="rounded-lg p-1.5 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700 sm:p-2 md:p-2 lg:p-2.5"
                  >
                    <i className="fa-solid fa-phone dark:text-zinc-100 text-sm sm:text-base md:text-base lg:text-lg"></i>
                  </button>
                  <button
                    title={t('VideoCall')}
                    onClick={handleVideoCall}
                    className="rounded-lg p-1.5 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700 sm:p-2 md:p-2 lg:p-2.5"
                  >
                    <i className="fa-solid fa-video dark:text-zinc-100 text-sm sm:text-base md:text-base lg:text-lg"></i>
                  </button>
                  
                  {/* Message Search Button */}
                  <div className="relative">
                    <button
                      ref={searchButtonRef}
                      title="Search Messages (Ctrl+K)"
                      onClick={() => {
                        if (!showSearchDropdown) {
                          if (searchButtonRef.current) {
                            const rect = searchButtonRef.current.getBoundingClientRect();
                            const dropdownX = rect.left - 200;
                            const dropdownY = rect.bottom + 20;
                            setDropdownPosition({ x: dropdownX, y: dropdownY });
                          }
                        }
                        setShowSearchDropdown(!showSearchDropdown);
                      }}
                      className="rounded-lg p-1.5 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700 sm:p-2 md:p-2.5 lg:p-3"
                    >
                      <i className="fa-solid fa-magnifying-glass dark:text-zinc-100 text-sm sm:text-base md:text-base lg:text-lg"></i>
                    </button>
                    
                    {/* Search Dropdown - Better responsive positioning */}
                    {showSearchDropdown && (
                      <div 
                        ref={dropdownRef}
                        className="search-dropdown fixed top-12 w-64 sm:w-72 bg-white dark:bg-black rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50"
                        style={{
                          left: `${dropdownPosition.x}px`,
                          top: `${dropdownPosition.y}px`
                        }}
                      >
                        {/* Drag Handle - Better responsive styling */}
                        <div 
                          className={`drag-handle p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 cursor-move bg-gray-50 dark:bg-gray-900 rounded-t-xl transition-all duration-200 select-none ${
                            isDragging 
                              ? 'bg-gray-100 dark:bg-gray-800 shadow-lg ring-2 ring-gray-300 dark:ring-gray-600' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setIsStartingDrag(true);
                            
                            if (dropdownRef.current) {
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
                            if (isStartingDrag) {
                              return;
                            }
                          }}
                          title="Drag to move search dropdown"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full transition-colors sm:w-2 sm:h-2 ${
                                isDragging ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                              }`}></div>
                              <div className={`w-1.5 h-1.5 rounded-full transition-colors sm:w-2 sm:h-2 ${
                                isDragging ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                              }`}></div>
                              <div className={`w-1.5 h-1.5 rounded-full transition-colors sm:w-2 sm:h-2 ${
                                isDragging ? 'bg-gray-600 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                              }`}></div>
                            </div>
                            <div className="flex-1 ml-3 sm:ml-4">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Search Messages</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Search in your chat with {opChat?.fullname || 'this user'}
                              </p>
                            </div>
                            <button
                              onClick={handleDropdownClose}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2 sm:ml-3 transition-colors"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3 sm:p-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder="Search in this conversation..."
                              value={messageSearchQuery}
                              onChange={(e) => setMessageSearchQuery(e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-all duration-200"
                              autoFocus
                            />
                            {messageSearchQuery && (
                              <button
                                onClick={() => setMessageSearchQuery('')}
                                className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Search Results Counter and Navigation - Better responsive layout */}
                          {messageSearchQuery.trim() && searchResults.length > 0 && (
                            <div className="mt-3 sm:mt-4 flex items-center justify-between">
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {selectedResultIndex + 1} of {searchResults.length} matches
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                  onClick={() => handleSearchNavigation('up')}
                                  className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                  title="Previous result"
                                >
                                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleSearchNavigation('down')}
                                  className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                  title="Next result"
                                >
                                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Status Messages - Better responsive spacing */}
                          {messageSearchQuery.trim() && searchResults.length === 0 && !isSearching && (
                            <div className="mt-3 sm:mt-4 text-center text-gray-500 dark:text-gray-400">
                              <Search className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
                              <p className="text-xs sm:text-sm">No messages found</p>
                              <p className="text-xs mt-0.5 sm:mt-1">Try different keywords</p>
                            </div>
                          )}
                          
                          {/* Loading State - Better responsive spacing */}
                          {isSearching && (
                            <div className="mt-3 sm:mt-4 text-center text-gray-500 dark:text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-1.5 sm:mb-2"></div>
                              <p className="text-xs sm:text-sm">Searching messages...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <hr className="dark:border-neutral-700" />

              {/* Messages Area - Smaller for large devices */}
              <div className="flex-1 overflow-y-scroll scrollbar-hide px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 lg:px-5 lg:py-3">
                {!chatPartner ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center px-4">
                      <p className="text-base text-gray-500 dark:text-neutral-400 mb-2 sm:text-lg">Select a chat to start messaging</p>
                      <p className="text-sm text-gray-400">Choose someone from the chat list</p>
                    </div>
                  </div>
                ) : isLoadingMessages ? (
                  <MessageSkeleton />
                ) : messagesError ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center px-4">
                      <p className="text-base text-red-500 dark:text-red-400 mb-2 sm:text-lg">
                        {messagesError?.message || t('ErrorLoadingMessages') || 'Error loading messages'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {messagesError?.response?.data?.message || 'Please check your connection and try again'}
                      </p>
                      <button 
                        onClick={() => refreshMessages()}
                        className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors sm:px-5 sm:py-2.5"
                      >
                        {t('Retry') || 'Retry'}
                      </button>
                    </div>
                  </div>
                ) : chatMessages?.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center px-4">
                      <p className="text-base text-gray-500 dark:text-neutral-400 mb-2 sm:text-lg">No messages yet</p>
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
                    
                    {/* Typing Indicator - Smaller for large devices */}
                    {isUserTyping(opChat?.userId, user?.id) && (
                      <div className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3" ref={typingIndicatorRef}>
                        <div className="flex items-start">
                          {/* Avatar */}
                          <div className="flex-shrink-0 mr-2 sm:mr-3 md:mr-3 lg:mr-4">
                            <img
                              src={opChat?.avatar || AvatarDefault.src}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full border border-gray-300 dark:border-gray-600 sm:h-11 sm:w-11 md:h-11 md:w-11 lg:h-12 lg:w-12"
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

              {/* Message Input Area - Smaller for large devices */}
              <div className="relative w-full p-2 sm:p-2.5 md:p-3 lg:p-4 lg:pt-0 xl:pt-0 xl:p-4">
                {files.length > 0 && (
                  <div className="absolute bottom-20 left-0 right-0 mx-2 rounded-lg bg-neutral-800 p-2 shadow-lg dark:bg-neutral-800 sm:bottom-21 sm:mx-2.5 sm:p-2.5 md:bottom-22 md:mx-3 md:p-3 lg:bottom-24 lg:mx-4 lg:p-3 xl:bottom-26 xl:mx-4">
                    <FileUploadProgress
                      files={files}
                      onRemove={handleRemoveFile}
                      onClearAll={handleClearAllFiles}
                      showFileInfo={true}
                      className="max-h-32 sm:max-h-36 md:max-h-40 lg:max-h-44 xl:max-h-48 overflow-y-auto"
                    />
                  </div>
                )}

                {/* Reply indicator - Smaller for large devices */}
                {replyingTo && (
                  <div className="absolute bottom-20 left-0 right-0 mx-2 rounded-lg bg-gray-50 dark:bg-gray-900 p-2 shadow-lg border border-gray-200 dark:border-gray-700 sm:bottom-21 sm:mx-2.5 sm:p-2.5 md:bottom-22 md:mx-3 md:p-3 lg:bottom-24 lg:mx-4 lg:p-3 xl:bottom-26 xl:mx-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <Reply className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 flex-shrink-0 sm:w-4 sm:h-4" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium sm:text-sm">
                            {getReplyContext(replyingTo)}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[180px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[350px]">
                            {replyingTo.content ? 
                              (replyingTo.content.length > 35 ? 
                                replyingTo.content.substring(0, 35) + '...' : 
                                replyingTo.content
                              ) : 
                              'File message'
                            }
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelReply}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 ml-2 sm:ml-2.5"
                        title="Cancel reply"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input - Smaller for large devices */}
                <div className="flex w-full items-center justify-center rounded-2xl sm:rounded-2xl md:rounded-3xl border border-zinc-300 p-2 text-black dark:border-neutral-700 dark:text-white sm:p-2.5 md:p-3 lg:p-3.5 xl:p-4">
                  {user?.avatar?.url && (
                    <Link href={`/others-profile/${user?.username}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={user?.avatar.url}
                        alt="Avatar"
                        className="h-7 w-7 rounded-full border-2 border-gray-500 dark:border-neutral-700 cursor-pointer sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 xl:h-11 xl:w-11"
                      />
                    </Link>
                  )}

                  <button
                    onClick={() => document.getElementById('chatFileInput').click()}
                    className="ml-1 mr-1 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500 sm:ml-1.5 sm:mr-1.5 md:ml-2 md:mr-2 lg:ml-2.5 lg:mr-2.5 xl:ml-3 xl:mr-3"
                  >
                    <Plus size={18} className="sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
                  </button>
                  <input
                    type="file"
                    id="chatFileInput"
                    className="hidden"
                    multiple
                    accept="*/*"
                    onChange={handleFileChange}
                  />

                  <div className="flex-grow relative min-w-0">
                    <input
                      type="text"
                      placeholder={replyingTo ? `${getReplyContext(replyingTo)}: ${replyingTo.content ? (replyingTo.content.length > 25 ? replyingTo.content.substring(0, 25) + '...' : replyingTo.content) : 'File message'}` : t('Message')}
                      className={`w-full rounded-2xl sm:rounded-2xl md:rounded-3xl border border-zinc-300 px-2 py-1.5 text-black placeholder-zinc-400 focus:outline-none dark:border-neutral-700 dark:bg-black dark:text-white text-sm sm:px-2.5 sm:py-2 sm:text-base md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 ${replyingTo ? 'pl-6 sm:pl-6 md:pl-7 lg:pl-8 xl:pl-9' : ''}`}
                      value={replyingTo ? replyInput : newMessage}
                      onChange={(e) => {
                        if (replyingTo) {
                          setReplyInput(e.target.value);
                        } else {
                          setNewMessage(e.target.value);
                        }
                        
                        if (chatPartner && e.target.value.trim()) {
                          handleTyping(chatPartner, true);
                        } else if (chatPartner && !e.target.value.trim()) {
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
                        if (chatPartner) {
                          stopTyping(chatPartner);
                        }
                      }}
                    />
                    {replyingTo && (
                      <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none sm:left-1.5 md:left-2 lg:left-2.5 xl:left-3">
                        <Reply className="w-3 h-3 text-gray-600 dark:text-gray-400 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="ml-1 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500 sm:ml-1.5 md:ml-2 lg:ml-2.5 xl:ml-3"
                  >
                    <Smile size={18} className="sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
                  </button>

                  {showPicker && (
                    <div ref={pickerRef} className="absolute bottom-16 right-2 z-50 sm:bottom-17 sm:right-2.5 md:bottom-18 md:right-3 lg:bottom-20 lg:right-4 xl:bottom-22 xl:right-4">
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
                      className="ml-1 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500 transition-all duration-200 hover:scale-105 active:scale-95 sm:ml-1.5 md:ml-2 lg:ml-2.5 xl:ml-3"
                      title={replyingTo ? "Send reply" : "Send message"}
                    >
                      <Send size={18} className="sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
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
