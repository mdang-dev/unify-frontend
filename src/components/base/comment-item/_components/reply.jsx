import { Button } from '@heroui/react';
import Image from 'next/image';
import Content from './content';
import { formatDistanceToNow } from 'date-fns';
import defaultAvatar from 'public/images/unify_icon_2.svg';

const Reply = ({ reply, onReplyClick }) => {
  return (
    <div className="mb-2 flex w-full items-start gap-2 rounded-lg border-l-2 border-gray-200 bg-gray-50/60 pl-8 dark:border-neutral-700 dark:bg-neutral-800/40">
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
          <span className="max-w-[100px] truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
            {reply.username || 'Unknown'}
          </span>
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
            {reply.commentedAt && !isNaN(new Date(reply.commentedAt).getTime())
              ? formatDistanceToNow(new Date(reply.commentedAt), { addSuffix: true })
              : 'Just now'}
          </span>
        </div>
        <div className="mt-1 break-words text-xs text-gray-800 dark:text-gray-200">
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
  );
};

export default Reply;
