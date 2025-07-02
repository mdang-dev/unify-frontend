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
import Message from './_components/message';
import { useState, useRef, useEffect } from 'react';
import Picker from 'emoji-picker-react';
import { Smile, Send, Plus } from 'lucide-react';
import { useChat } from '@/src/hooks/use-chat';
import { useSearchParams } from 'next/navigation';
import AvatarDefault from '@/public/images/unify_icon_2.svg';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { callCommandApi } from '@/src/apis/call/command/call.command.api';
import { addToast } from '@heroui/react';

const Messages = () => {
  const user = useAuthStore((s) => s.user);
  const [chatPartner, setChatPartner] = useState(null);
  const [opChat, setOpChat] = useState({
    userId: '',
    avatar: '',
    fullname: '',
    username: '',
  });
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { chatMessages, sendMessage, chatList } = useChat(user, chatPartner);
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

  const filteredChatList = chatList?.filter(
    (chat) =>
      chat.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleSendMessage = () => {
    if (newMessage || files) {
      sendMessage(newMessage, files, messagesEndRef);
      setNewMessage('');
      setFiles([]);
    }
  };

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

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const validFiles = [];

    newFiles.forEach((file) => {
      if (file.size <= MAX_FILE_SIZE_BYTES) {
        validFiles.push({
          file,
          preview:
            file.type.startsWith('image/') || file.type.startsWith('video/')
              ? URL.createObjectURL(file)
              : null,
        });
      } else {
        alert(`${file.name} exceeds 50MB and was not added.`);
      }
    });

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handlePreview = (fileObj) => {
    if (fileObj.preview) {
      window.open(fileObj.preview, '_blank');
    } else {
      alert('No preview available for this file.');
    }
  };

  const handleChatSelect = (chat) => {
    setOpChat({
      userId: chat?.userId,
      avatar: chat?.avatar?.url,
      fullname: chat?.fullname,
      username: chat?.username,
    });
    setChatPartner(chat?.userId);
  };

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
            title: 'Error',
            description: 'Error when calling !',
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
            title: 'Error',
            description: 'Error when calling !',
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
              <h1 className="text-3xl font-bold dark:text-white">Message</h1>
            </div>
            <div className="mb-2">
              <Input
                placeholder={'Search...'}
                className={`h-10 w-full border-gray-300 p-3 placeholder-gray-500 dark:border-neutral-600`}
                value={searchQuery} // Bind input to searchQuery state
                onChange={(e) => setSearchQuery(e.target.value)} // Update searchQuery on input change
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-scroll border-r-1 px-4 py-1 scrollbar-hide dark:border-r-neutral-700 dark:bg-black">
            {filteredChatList?.length > 0 ? (
              filteredChatList.map((chat, index) => (
                <div
                  key={index}
                  className={`mt-3 flex w-full max-w-md cursor-pointer items-center justify-between rounded-lg p-3 transition duration-200 ease-in-out ${
                    chat.userId === chatPartner
                      ? 'bg-gray-200 shadow-md ring-1 ring-white dark:bg-neutral-800 dark:ring-neutral-600'
                      : 'hover:bg-gray-300 dark:hover:bg-neutral-700'
                  } text-black dark:text-white`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-center">
                    <img
                      src={chat?.avatar?.url || AvatarDefault?.src}
                      alt="Avatar"
                      className="h-12 w-12 rounded-full border-2 border-gray-500 dark:border-neutral-500"
                    />
                    <div className="ml-4">
                      <h4 className="w-23 truncate text-sm font-medium">
                        {chat?.fullname || opChat?.fullname}
                      </h4>
                      <p className="w-60 truncate text-sm text-neutral-500 dark:text-gray-400">
                        {chat?.lastMessage}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(chat?.lastUpdated).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-lg text-gray-500 dark:text-neutral-400">
                  Let&apos;s start with a chat
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
                  Select a chat to start messaging
                </h1>
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full p-3">
                <div className="flex grow">
                  <img
                    src={opChat?.avatar || AvatarDefault.src}
                    alt="Avatar user"
                    className="h-12 w-12 rounded-full border-2 border-gray-500 dark:border-neutral-700"
                  />
                  <div className="ml-5">
                    <h4 className="w-60 truncate text-sm font-medium">
                      {opChat?.fullname || 'Fullname'}
                    </h4>
                    <p className="w-40 truncate text-sm text-gray-500 dark:text-neutral-400">
                      {' '}
                      {opChat?.username || 'Username'}
                    </p>
                  </div>
                </div>
                <div className="flex w-1/3 items-center justify-end text-2xl">
                  <button
                    title="Call"
                    onClick={handleCall}
                    className="mr-2 rounded-md p-2 transition duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-neutral-700"
                  >
                    <i className="fa-solid fa-phone dark:text-zinc-100"></i>
                  </button>
                  <button
                    title="Video Call"
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
                {/* <h2 className="text-center m-3 dark:text-neutral-400">
                  23:48, 20/01/2025
                </h2> */}
                <Message
                  messages={chatMessages}
                  messagesEndRef={messagesEndRef}
                  avatar={opChat.avatar || AvatarDefault.src}
                />
              </div>

              <div className={`relative w-full`}>
                {files.length > 0 && (
                  <div className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 absolute mb-3 mt-3 w-[99.8%] translate-y-[-120px] overflow-x-auto rounded-lg bg-neutral-800 p-2">
                    <div className="flex gap-1">
                      {files.map((fileObj, index) => (
                        <div
                          key={index}
                          className="relative w-20 flex-shrink-0 cursor-pointer text-center"
                          onClick={() => handlePreview(fileObj)}
                        >
                          {/* File Preview / Icon */}
                          {fileObj.preview && fileObj.file.type.startsWith('image/') ? (
                            <img
                              src={fileObj.preview}
                              alt="Preview"
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : fileObj.preview && fileObj.file.type.startsWith('video/') ? (
                            <video src={fileObj.preview} className="h-16 w-16 rounded-lg" />
                          ) : fileIcons[fileObj.file.type] ? (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-700">
                              {fileIcons[fileObj.file.type]}
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-700 text-sm">
                              📄
                            </div>
                          )}

                          <p className="mt-1 w-16 truncate text-xs">{fileObj.file.name}</p>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(index);
                            }}
                            className="absolute right-[14px] top-0 rounded-full bg-transparent p-1 text-xs text-white"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex w-full items-center justify-center rounded-3xl border border-zinc-300 p-3 text-black dark:border-neutral-700 dark:text-white">
                  {user?.avatar?.url && (
                    <img
                      src={user?.avatar.url}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full border-2 border-gray-500 dark:border-neutral-700"
                    />
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
                    placeholder="Message..."
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
                      className="ml-2 text-black hover:text-zinc-500 dark:text-zinc-100 dark:hover:text-zinc-500"
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
