'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Smile, Send } from 'lucide-react';
import Picker from 'emoji-picker-react';
import defaultAvatar from 'public/images/unify_icon_2.svg';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsCommandApi } from '@/src/apis/comments/command/comments.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

const CommentInput = ({ postId, setComments, parentComment, onCancelReply }) => {
  const [comment, setComment] = useState('');
  const [isCommentEmpty, setIsCommentEmpty] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState(null);
  const pickerRef = useRef(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (content) => {
      if (!user?.id || !postId || !content) {
        setError('Missing required data to submit comment.');
      }

      return commentsCommandApi.createComment({
        userId: user.id,
        postId,
        content,
        parentId: parentComment?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS_BY_POST, postId] });
      setComment(parentComment ? `@${parentComment.username} ` : '');
      setIsCommentEmpty(!parentComment);
    },
    onError: (err) => {
      setError(err.message || 'Failed to post comment');
    },
  });

  useEffect(() => {
    if (parentComment) {
      setComment(`@${parentComment.username} `);
      setIsCommentEmpty(false);
    } else {
      setComment('');
      setIsCommentEmpty(true);
    }
  }, [parentComment]);

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    mutation.mutate(comment);
  };

  const handleCancel = () => {
    setComment(''); // Reset textarea
    setIsCommentEmpty(true);
    if (onCancelReply) onCancelReply(); // Gọi hàm reset replyingTo
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        !event.target.closest('button')
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative flex w-full items-center justify-center rounded-2xl text-white">
      {/* Hiển thị avatar của người dùng hiện tại */}
      <div className="relative mr-2 h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300">
        {user?.avatar?.url ? (
          <Image
            src={user.avatar.url}
            alt={`${user.username || 'Unknown'}'s avatar`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={defaultAvatar}
            alt="Default Avatar"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <textarea
        placeholder={parentComment ? `Reply to @${parentComment.username}...` : 'Add a comment...'}
        maxLength={150}
        rows={1}
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          setIsCommentEmpty(
            e.target.value.trim() === (parentComment ? `@${parentComment.username} ` : '')
          );
        }}
        onInput={(e) => {
          e.target.style.height = 'auto';
          const maxHeight = 3 * parseFloat(getComputedStyle(e.target).lineHeight);
          if (e.target.scrollHeight > maxHeight) {
            e.target.style.height = `${maxHeight}px`;
            e.target.style.overflowY = 'auto';
          } else {
            e.target.style.height = `${e.target.scrollHeight}px`;
            e.target.style.overflowY = 'hidden';
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommentSubmit();
          }
        }}
        className="flex-grow resize-none rounded-2xl border-1 border-neutral-300 px-4 py-2 text-black focus:outline-none dark:border-none dark:bg-neutral-800 dark:text-white dark:placeholder-zinc-200"
      />
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="ml-2 text-zinc-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-zinc-200"
      >
        <Smile size={28} />
      </button>
      {showPicker && (
        <div ref={pickerRef} className="absolute bottom-20 right-12 z-50">
          <Picker
            onEmojiClick={(emojiObject) => {
              const newComment = comment + emojiObject.emoji;
              setComment(newComment);
              setIsCommentEmpty(
                newComment.trim() === (parentComment ? `@${parentComment.username} ` : '')
              );
            }}
          />
        </div>
      )}
      {!isCommentEmpty && (
        <>
          <button
            type="submit"
            onClick={handleCommentSubmit}
            className="ml-2 text-zinc-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-zinc-200"
          >
            <Send size={28} />
          </button>
          {parentComment && (
            <button
              type="button"
              onClick={handleCancel}
              className="ml-2 text-zinc-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          )}
        </>
      )}
      {error && (
        <div className="absolute top-[-50px] rounded-xl border border-red-300/40 bg-[rgba(255,255,255,0.25)] px-4 py-2 text-sm text-red-600 shadow-md backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default CommentInput;
