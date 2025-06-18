'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import React, { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { commentsQueryApi } from '@/src/apis/comments/query/comments.query.api';
import { CommentItem, CommentInput } from '.';
import Skeleton from './skeleton';
import { useAuthStore } from '@/src/stores/auth.store';

export default function CommentButton({ children, className = '', postId }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [replyingTo, setReplyingTo] = useState(null);
  const commentsContainerRef = useRef(null);
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS_BY_POST, postId],
    queryFn: () => commentsQueryApi.getCommentsByPostId(postId),
    enabled: !!postId && isOpen,
  });

  const updateComments = useCallback(
    (newComment) => {
      if (!comments) return;

      const updateRepliesRecursively = (comments) =>
        comments.map((comment) => {
          if (comment.id === newComment.parentId) {
            return {
              ...comment,
              replies: [
                { ...newComment, username: user?.username || 'Unknown' },
                ...(comment.replies || []),
              ],
            };
          }
          if (comment.replies?.length) {
            return {
              ...comment,
              replies: updateRepliesRecursively(comment.replies),
            };
          }
          return comment;
        });

      const updatedComments = newComment.parentId
        ? updateRepliesRecursively(comments)
        : [{ ...newComment, username: user?.username || 'Unknown' }, ...comments];

      commentsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setReplyingTo(null);
      // Optionally update cache using queryClient.setQueryData if persistence is needed
    },
    [comments, user]
  );

  const handleReplyClick = useCallback((comment) => {
    setReplyingTo(comment);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleOpen = () => {
    onOpen();
  };

  const CommentSkeleton = () => (
    <div className="items-start">
      <div className="mb-14 flex space-x-2">
        <Skeleton variant="circle" width={32} height={32} />
        <div className="flex-1">
          <Skeleton width={96} height={12} rounded />
          <Skeleton width="75%" height={12} rounded className="mt-1" />
          <Skeleton width="50%" height={12} rounded className="mt-1" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={handleOpen} className={`bg-transparent dark:text-white ${className}`}>
        {children}
      </button>
      <Modal
        isDismissable
        scrollBehavior="inside"
        backdrop="blur"
        size="3xl"
        isKeyboardDismissDisabled
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Comments</ModalHeader>
              <ModalBody ref={commentsContainerRef}>
                {isLoading ? (
                  [...Array(5)].map((_, index) => <CommentSkeleton key={index} />)
                ) : comments?.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      onReplySubmit={updateComments}
                      onReplyClick={handleReplyClick}
                    />
                  ))
                ) : (
                  <p className="text-xl font-bold text-zinc-500">No comments yet</p>
                )}
              </ModalBody>
              <ModalFooter>
                <CommentInput
                  postId={postId}
                  setComments={updateComments}
                  parentComment={replyingTo}
                  onCancelReply={handleCancelReply}
                />
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
