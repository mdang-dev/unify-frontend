import { X } from 'lucide-react';
import Image from 'next/image';
import Avatar from '@/public/images/unify_icon_2.svg';

const UserHistorySearch = ({ user, onClick, onDelete, isHistory = false }) => {
  return (
    <div
      className="group relative flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
      onClick={onClick}
    >
      <div className="h-12 w-12 overflow-hidden rounded-full">
        <Image
          src={isHistory ? (user?.avatar?.url || user?.avatar || Avatar) : (user.avatar?.url || Avatar)}
          alt={user.username}
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{user.username}</p>
        <p className="text-sm text-gray-500">{`${user.firstName} ${user.lastName}`}</p>
      </div>

      {isHistory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default UserHistorySearch;
