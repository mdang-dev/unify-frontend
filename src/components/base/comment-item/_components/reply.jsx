import { Button } from '@heroui/react';
import Image from 'next/image';
import Content from './content';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useRef, memo } from 'react';
import { addToast } from '@heroui/react';
import defaultAvatar from '@/public/images/unify_icon_2.png';
import CommentReportModal from './comment-report-modal';
import DeleteCommentModal from './delete-comment-modal';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import { commentsCommandApi } from '@/src/apis/comments/command/comments.command.api';
import { useMutation } from '@tanstack/react-query';
const ReplyComponent = ({
  reply,
  currentUserId,
  onReplySubmit,
  onReplyClick,
  onCommentDeleted,
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // Check if this reply belongs to the current user
  const isOwnReply = reply.userId === currentUserId;

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- MUTATION: Report Comment ---
  const reportCommentMutation = useMutation({
    mutationFn: ({ commentId, reason }) => reportsCommandApi.createCommentReport(commentId, reason),
    onSuccess: () => {
      addToast({
        title: 'Success',
        description: 'Comment reported successfully.',
        timeout: 3000,
        color: 'success',
      });
      setIsReportModalOpen(false);
      setShowMoreOptions(false);
    },
    onError: (error) => {
      let errorMessage = error?.message || 'Unknown error';
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed?.message) errorMessage = parsed.message;
      } catch {}
      const isDuplicate = errorMessage === 'You have reported this content before.';
      addToast({
        title: isDuplicate ? 'Already Reported' : 'Failed to Report',
        description: errorMessage,
        timeout: 3000,
        color: isDuplicate ? 'warning' : 'danger',
      });
      setIsReportModalOpen(false);
    },
  });

  // --- MUTATION: Delete Comment ---
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentsCommandApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      addToast({
        title: 'Success',
        description: 'Comment deleted successfully.',
        timeout: 3000,
        color: 'success',
      });
      onCommentDeleted?.(commentId);
      setIsDeleteModalOpen(false);
      setShowMoreOptions(false);
    },
    onError: () => {
      addToast({
        title: 'Error',
        description: `Failed to delete comment !`,
        timeout: 3000,
        color: 'danger',
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  // --- Handlers ---
  const handleReportComment = (reason) => {
    reportCommentMutation.mutate({ commentId: comment.id, reason });
  };

  const openReportModal = () => {
    setIsReportModalOpen(true);
    setShowMoreOptions(false);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setShowMoreOptions(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = () => {
    deleteCommentMutation.mutate(reply.id);
  };

  return (
    <>
      <div className="mb-2 pt-2 flex w-full items-start gap-2 rounded-lg border-l-2 border-gray-200 bg-zinc-50/30 pl-8 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="relative mt-1 h-8 w-8 overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700">
          {reply.avatarUrl ? (
            <Image
              src={reply.avatarUrl}
              alt={`${reply.username || 'Unknown'}'s avatar`}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={defaultAvatar}
              alt="Default Avatar"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="max-w-[100px] truncate text-xs font-bold text-neutral-900 dark:text-gray-100">
              {reply.username || 'Unknown'}
            </span>
            <span className="truncate text-xs text-gray-500 dark:text-gray-400">
              {reply.commentedAt && !isNaN(new Date(reply.commentedAt).getTime())
                ? formatDistanceToNow(new Date(reply.commentedAt), {
                    addSuffix: true,
                  })
                : 'Just now'}
            </span>
          </div>
          <div className="mt-1 break-words text-xs font-semibold text-gray-800 dark:text-gray-200">
            <Content text={reply.content} className="leading-snug" />
          </div>
          <div className="mt-1 flex gap-2">
            <Button
              size="sm"
              className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
              onPress={() => onReplyClick(reply)}
              aria-label="Reply to reply"
            >
              <i className="fa-solid fa-reply mr-1"></i>Reply
            </Button>
            <div className="relative" ref={dropdownRef}>
              <Button
                size="sm"
                className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                startContent={<i className="fa-solid fa-ellipsis"></i>}
                aria-label="More actions"
                onPress={() => setShowMoreOptions(!showMoreOptions)}
                isDisabled={isDeleting}
              >
                More
              </Button>

              {showMoreOptions && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                  {isOwnReply ? (
                    <>
                      <button
                        onClick={openDeleteModal}
                        disabled={isDeleting}
                        className="w-full px-4 py-3 text-left text-sm text-red-500 transition-colors duration-200 hover:bg-gray-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-neutral-700"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setShowMoreOptions(false)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-500 transition-colors duration-200 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={openReportModal}
                        className="w-full px-4 py-3 text-left text-sm text-red-500 transition-colors duration-200 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-neutral-700"
                      >
                        Report
                      </button>
                      <button
                        onClick={() => setShowMoreOptions(false)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-500 transition-colors duration-200 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CommentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportComment}
        commentId={reply.id}
      />

      <DeleteCommentModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

const areEqual = (prevProps, nextProps) => {
  const prev = prevProps.reply;
  const next = nextProps.reply;
  if (prev.id !== next.id) return false;
  if (prev.content !== next.content) return false;
  if (prev.username !== next.username) return false;
  if (prev.commentedAt !== next.commentedAt) return false;
  // replies of replies not rendered here, so shallow checks are enough
  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  return true;
};

const Reply = memo(ReplyComponent, areEqual);

export default Reply;
