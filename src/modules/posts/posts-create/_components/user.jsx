import Image from 'next/image';

const User = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 dark:border-neutral-700">
        <Image
          src={user.avatar?.url || '/images/default-avatar.png'}
          alt="Avatar"
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">@{user?.username}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {user?.firstName} {user?.lastName}
        </p>
      </div>
    </div>
  );
};

export default User;
