import { Skeleton } from '@heroui/react';
import React from 'react';

const PostLoading = () => {
  return (
    <div className="mx-auto mt-8 w-3/4 opacity-10">
      <div className="flex">
        <Skeleton className="h-14 w-14 rounded-full">User</Skeleton>
        <div className="ml-2 flex flex-col">
          <Skeleton className="h-6 rounded-md">
            <div>@username.username</div>
          </Skeleton>
          <Skeleton className="mt-1 h-6 rounded-md">
            <div>Johnny Dang</div>
          </Skeleton>
        </div>
      </div>
      <Skeleton className="mx-auto my-2 w-[450px] rounded-lg">
        <div className="h-[400px]">Images/ Videos</div>
      </Skeleton>
      <Skeleton className="mx-auto mt-1 w-[450px] rounded-md">
        <div>Captions</div>
      </Skeleton>

      <Skeleton className="mx-auto mt-1 w-[450px] rounded-md">
        <div className="flex flex-col text-xl">
          <div className="flex gap-2">Three buttons</div>

          <div>
            <span className="text-base text-zinc-400">0 likes</span>
          </div>
        </div>
      </Skeleton>

      <Skeleton className="mx-auto mt-1 flex w-[450px] flex-wrap rounded-md">
        <div>Hashtag</div>
      </Skeleton>
      <Skeleton className="mx-auto mt-1 w-[450px] rounded-md">
        <div className="text-md animate-none text-black transition-none hover:text-gray-500 dark:text-zinc-400 dark:hover:text-white">
          View all comments
        </div>
      </Skeleton>
    </div>
  );
};

export default PostLoading;
