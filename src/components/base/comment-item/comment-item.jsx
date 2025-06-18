import { Card, CardFooter, Button } from '@heroui/react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import Reply from './_components/reply';
import Content from './_components/content';
import defaultAvatar from '@/public/images/unify_icon_2.svg';

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

const CommentItem = ({ comment, currentUserId, onReplySubmit, onReplyClick }) => {
  const [isShown, setIsShown] = useState(false);
  // Lấy tất cả replies phẳng (cấp 2, 3, 4...)
  const allReplies = comment.replies ? flattenReplies(comment.replies) : [];

  return (
    <Card
      key={comment.id}
      className="mb-2 overflow-visible border-none bg-transparent p-0 shadow-none"
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
                ? formatDistanceToNow(new Date(comment.commentedAt), { addSuffix: true })
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
              <i className="fa-solid fa-reply mr-1"></i>Reply
            </Button>
            {comment.replies && comment.replies.length > 0 && (
              <Button
                onPress={() => setIsShown(!isShown)}
                size="sm"
                className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                aria-label={isShown ? 'Hide replies' : 'Show replies'}
              >
                <i className="fa-solid fa-comments mr-1"></i>
                {isShown ? 'Hide Replies' : `Show Replies (${allReplies.length})`}
              </Button>
            )}
            <Button
              size="sm"
              className="bg-transparent px-2 py-1 text-xs hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
              startContent={<i className="fa-solid fa-ellipsis"></i>}
              aria-label="More actions"
            >
              More
            </Button>
          </div>
        </div>
      </div>
      {isShown && allReplies.length > 0 && (
        <div className="mt-2 flex w-full flex-col items-end rounded-lg border-l-2 border-gray-200 bg-gray-50/60 pl-8 dark:border-neutral-700 dark:bg-neutral-800/40">
          {allReplies.map((reply) => (
            <Reply
              key={reply.id}
              reply={reply}
              currentUserId={currentUserId}
              onReplySubmit={onReplySubmit}
              onReplyClick={onReplyClick}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default CommentItem;
