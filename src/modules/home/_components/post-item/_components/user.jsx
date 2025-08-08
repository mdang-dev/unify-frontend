import Link from 'next/link';
import { Avatar } from '@heroui/react';

const User = ({ user }) => (
  <Link href={`/others-profile/${user?.username}`} className="transition-opacity hover:opacity-80">
    <div className="flex items-center">
      <Avatar
        className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 transition-transform hover:scale-105 dark:border-neutral-700"
        src={user?.avatar?.url || '/images/unify_icon_2.png'}
      />
      <div className="ml-3">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">@{user?.username}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {user?.firstName} {user?.lastName}
        </p>
      </div>
    </div>
  </Link>
);

export default User;
