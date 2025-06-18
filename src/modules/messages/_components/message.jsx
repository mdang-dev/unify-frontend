'use client';

import { useAuthStore } from '@/src/stores/auth.store';
import { File, FileText, FileImage, FileVideo, FileMusic } from 'lucide-react';

const Message = ({ messages, messagesEndRef, avatar }) => {
  const user = useAuthStore((s) => s.user);
  const currentUser = user.id;

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

  return (
    <div className="m-4 mb-0 flex flex-col gap-3">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender === currentUser;
        const isFirstOfGroup = index === 0 || messages[index - 1].sender !== message.sender;
        const isLastOfGroup =
          index === messages.length - 1 || messages[index + 1].sender !== message.sender;

        return (
          <div
            key={message.id || message.timestamp}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
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
              } ${!isCurrentUser && !isFirstOfGroup ? 'pl-[50]' : ''}`}
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
                              className="max-w-40 rounded-lg shadow-md"
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
                  }`}
                >
                  {message.content}
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
    </div>
  );
};

export default Message;
