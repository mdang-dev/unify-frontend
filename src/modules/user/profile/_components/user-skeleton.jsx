const UserSkeleton = () => (
  <div className="flex animate-pulse items-center justify-between p-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-neutral-700" />
        <div className="h-3 w-16 rounded bg-gray-200 dark:bg-neutral-700" />
      </div>
    </div>
    <div className="h-8 w-20 rounded bg-gray-200 dark:bg-neutral-700" />
  </div>
);

export default UserSkeleton;
