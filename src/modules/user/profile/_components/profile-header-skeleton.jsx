const ProfileHeaderSkeleton = () => (
  <div className="flex animate-pulse px-4 sm:px-6">
    {/* Avatar Skeleton */}
    <div className="h-36 w-36 flex-shrink-0 sm:h-48 sm:w-48">
      <div className="h-full w-full rounded-full bg-gray-200 dark:bg-neutral-700" />
    </div>

    {/* Profile Info Skeleton */}
    <div className="ml-12 flex-1">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-neutral-700" />

      {/* Stats Skeleton */}
      <div className="mt-4 flex space-x-8">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="text-center">
            <div className="h-6 w-16 rounded bg-gray-200 dark:bg-neutral-700" />
            <div className="mt-1 h-4 w-12 rounded bg-gray-200 dark:bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Bio Skeleton */}
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-700" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-neutral-700" />
      </div>

      {/* Action Buttons Skeleton */}
      <div className="mt-6 flex space-x-3">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="h-10 w-full rounded-lg bg-gray-200 dark:bg-neutral-700" />
        ))}
      </div>
    </div>
  </div>
);

export default ProfileHeaderSkeleton;
