import { Card, CardFooter, Button } from '@heroui/react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useRef, memo } from 'react';
import { useTranslations } from 'next-intl';
import Reply from './_components/reply';
import Content from './_components/content';
import { toast } from 'sonner';
import defaultAvatar from '@/public/images/unify_icon_2.png';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import { commentsCommandApi } from '@/src/apis/comments/command/comments.command.api';
import CommentReportModal from './_components/comment-report-modal';
import DeleteCommentModal from './_components/delete-comment-modal';
import { useMutation } from '@tanstack/react-query';

// Hàm duyệt đệ quy để lấy tất cả replies phẳng
const flattenReplies = (replies) => {
  let flatList = [];
  const recurse = (replyArray) => {
    replyArray.forEach((reply) => {
      flatList.push(reply);
      if (reply.replies && reply.replies.length > 0) {
        recurse(reply.replies);
      }
    });
  };
  recurse(replies);
  return flatList;
};

const CommentItemComponent = ({
  comment,
  currentUserId,
  onReplySubmit,
  onReplyClick,
  onCommentDeleted,
}) => {
  const t = useTranslations('Home.PostItem.CommentItem');
  const [isShown, setIsShown] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy tất cả replies phẳng (cấp 2, 3, 4...)
  const allReplies = comment.replies ? flattenReplies(comment.replies) : [];

  // Check if this comment belongs to the current user
  const isOwnComment = comment.userId === currentUserId;

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
      toast.success(t('CommentReportedSuccessfully'));
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

      if (isDuplicate) {
        toast.warning(t('YouHaveReportedBefore'));
      } else {
        toast.error(errorMessage);
      }
      setIsReportModalOpen(false);
    },
  });

  // --- MUTATION: Delete Comment ---
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentsCommandApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      toast.success(t('CommentDeletedSuccessfully'));
      onCommentDeleted?.(commentId);
      setIsDeleteModalOpen(false);
      setShowMoreOptions(false);
    },
    onError: () => {
      toast.error(t('FailedToDelete'));
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  // --- Handlers ---
  const handleReportComment = (commentId, reason) => {
    reportCommentMutation.mutate({ commentId, reason });
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
    deleteCommentMutation.mutate(comment.id);
  };

  return (
    <>
      <Card
        key={comment.id}
        className="mb-2 overflow-visible rounded-none border-none bg-transparent p-0 shadow-none"
        data-comment-id={comment.id}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700">
            {comment.avatarUrl ? (
              <Image
                src={comment.avatarUrl}
                alt={`${comment.username || 'Unknown'}'s avatar`}
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="max-w-[120px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {comment.username || 'Unknown'}
              </span>
              <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                {comment.commentedAt && !isNaN(new Date(comment.commentedAt).getTime())
                  ? formatDistanceToNow(new Date(comment.commentedAt), {
                      addSuffix: true,
                    })
                  : 'Just now'}
              </span>
            </div>
            <div className="mt-1 break-words text-sm text-gray-800 dark:text-gray-200">
              <Content text={comment.content} className="leading-snug" />
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                onPress={() => onReplyClick(comment)}
                aria-label="Reply to comment"
              >
                <i className="fa-solid fa-reply mr-1"></i>
                {t('Reply')}
              </Button>
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  onPress={() => setIsShown(!isShown)}
                  size="sm"
                  className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                  aria-label={isShown ? 'Hide replies' : 'Show replies'}
                >
                  <i className="fa-solid fa-comments mr-1"></i>
                  {isShown ? t('HideReplies') : `${t('ShowReplies')} (${allReplies.length})`}
                </Button>
              )}
              <div className="relative" ref={dropdownRef}>
                <Button
                  size="sm"
                  className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                  startContent={<i className="fa-solid fa-ellipsis"></i>}
                  aria-label="More actions"
                  onPress={() => setShowMoreOptions(!showMoreOptions)}
                  isDisabled={isDeleting}
                >
                  {t('More')}
                </Button>

                {showMoreOptions && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                    {isOwnComment ? (
                      <>
                        <button
                          onClick={openDeleteModal}
                          disabled={isDeleting}
                          className="w-full px-4 py-3 text-left text-sm text-red-500 transition-colors duration-200 hover:bg-gray-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-neutral-700"
                        >
                          {isDeleting ? 'Deleting...' : t('Delete')}
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
                          {t('Report')}
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
        {isShown && allReplies.length > 0 && (
          <div className="mt-2 flex w-full flex-col items-end pl-8">
            {allReplies.map((reply) => (
              <Reply
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                onReplySubmit={onReplySubmit}
                onReplyClick={onReplyClick}
                onCommentDeleted={onCommentDeleted}
              />
            ))}
          </div>
        )}
      </Card>

      <CommentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportComment}
        commentId={comment.id}
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
  // Shallow compare fields that affect render
  const prev = prevProps.comment;
  const next = nextProps.comment;
  if (prev.id !== next.id) return false;
  if (prev.content !== next.content) return false;
  if (prev.username !== next.username) return false;
  if (prev.commentedAt !== next.commentedAt) return false;
  // Compare replies length to avoid deep traversal; detailed updates will come via new refs
  const prevReplies = Array.isArray(prev.replies) ? prev.replies.length : 0;
  const nextReplies = Array.isArray(next.replies) ? next.replies.length : 0;
  if (prevReplies !== nextReplies) return false;

  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  return true;
};

const CommentItem = memo(CommentItemComponent, areEqual);

export default CommentItem;
