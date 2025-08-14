import Image from 'next/image';

const ProfileHeader = ({ user, stats, onEdit, onViewArchive }) => (
  <div className="flex px-4 sm:px-6">
    {/* Avatar */}
    <div className="h-36 w-36 flex-shrink-0 sm:h-48 sm:w-48">
      <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-gray-300 dark:border-neutral-700">
        <Image
          src={user?.avatar?.url || '/images/unify_icon_2.png'}
          alt={user?.username || 'Default Avatar'}
          width={154}
          height={154}
          className="h-full w-full object-cover"
        />
      </div>
    </div>

    {/* Profile Info */}
    <div className="ml-12 flex-1">
      <div className="flex items-center justify-between">
        <h3 className="max-w-[200px] truncate text-2xl font-semibold text-neutral-800 dark:text-white">
          {user?.username}
        </h3>
      </div>

      {/* Stats */}
      <div className="mt-4 flex space-x-8">
        <div
          className="cursor-pointer text-center transition-opacity hover:opacity-80"
          onClick={stats.onToggleFriend}
        >
          <span className="font-bold text-neutral-800 dark:text-white">{stats.friendsCount}</span>{' '}
          <span className="font-medium text-neutral-700 dark:text-zinc-200">Friends</span>
        </div>
        <div
          className="cursor-pointer text-center transition-opacity hover:opacity-80"
          onClick={stats.onToggleFollower}
        >
          <span className="font-bold text-neutral-800 dark:text-white">{stats.followerCount}</span>{' '}
          <span className="font-medium text-neutral-700 dark:text-zinc-200">Followers</span>
        </div>
        <div
          className="cursor-pointer text-center transition-opacity hover:opacity-80"
          onClick={stats.onToggleFollowing}
        >
          <span className="font-bold text-neutral-800 dark:text-white">{stats.followingCount}</span>{' '}
          <span className="font-medium text-neutral-700 dark:text-zinc-200">Following</span>
        </div>
      </div>

      {/* Bio */}
      {user?.biography && (
        <p className="mt-4 text-sm font-semibold text-neutral-800 dark:text-white">
          &quot;{user.biography}&quot;
        </p>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <button
          className="flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-zinc-100 transition-colors hover:bg-zinc-200 hover:text-neutral-900 dark:bg-zinc-100 dark:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-zinc-100"
          onClick={onEdit}
        >
          <i className="fa-regular fa-pen-to-square mr-2"></i>
          <span>Edit Profile</span>
        </button>
        <button
          className="flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-zinc-100 transition-colors hover:bg-zinc-200 hover:text-neutral-900 dark:bg-zinc-100 dark:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-zinc-100"
          onClick={onViewArchive}
        >
          <i className="fa-solid fa-box-archive mr-2"></i>
          <span>View Archive</span>
        </button>
      </div>
    </div>
  </div>
);
export default ProfileHeader;
