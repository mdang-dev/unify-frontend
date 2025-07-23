'use client';

import Post from './_components/post';
import UnifyLogo from '@/src/components/base/full-unify-logo';
import SuggestedUsers from './_components/suggested-users';
import MainLayout from '@/src/layouts/main-layout';

export default function Home() {
  return (
    <MainLayout>
      <div className="flex">
        <div className="h-screen basis-3/4">
          <div id="newsfeed" className="no-scrollbar bg-[#f5f5f5] h-full overflow-y-scroll py-8">
            <div className="mx-auto flex flex-col w-full ">
              <Post />
            </div>
          </div>
        </div>
        <div className="border-l-1 sticky top-0 h-screen basis-1/4 py-8 dark:border-neutral-700">
          <div className="mx-auto flex w-3/4 flex-col">
            <div>
              <p className="mb-8 text-xl font-bold">People you may know</p>
              <div className="no-scrollbar max-h-[460px] overflow-y-auto pr-1">
                <SuggestedUsers />
              </div>
            </div>
            <hr className="my-4 dark:border-neutral-700" />
            <div>
              <UnifyLogo className="w-1/2" />
              <p className="mt-2 text-zinc-500">&copy; UNIFY FROM WORKAHOLICS</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
