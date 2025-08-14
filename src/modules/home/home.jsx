'use client';

import { useTranslations } from 'next-intl';
import Post from './_components/post';
import UnifyLogo from '@/src/components/base/full-unify-logo';
import SuggestedUsers from './_components/suggested-users';
import MainLayout from '@/src/layouts/main-layout';

export default function Home() {
  const t = useTranslations('Home');
  
  return (
    <MainLayout>
      <div className="flex">
        <div className="h-screen basis-3/4">
          <div
            id="newsfeed"
            className="no-scrollbar h-full overflow-y-scroll py-8 bg-[#f5f5f5] dark:bg-neutral-900"
          >
            <div className="mx-auto flex flex-col w-full max-w-full">
              <Post />
            </div>
          </div>
        </div>
        <div className="sticky top-0 h-screen basis-1/4 border-l border-neutral-200 py-8 dark:border-transparent">
          <div className="mx-auto flex w-3/4 flex-col">
            <div>
              <p className="mb-8 text-xl font-bold">{t('PeopleYouMayKnow')}</p>
              <div className="no-scrollbar max-h-[460px] overflow-y-auto pr-1">
                <SuggestedUsers />
              </div>
            </div>
            <hr className="my-4 border-neutral-200 dark:border-neutral-800 dark:opacity-30" />
            <div>
              <UnifyLogo className="w-1/2" />
              <p className="mt-2 text-zinc-500">{t('Copyright')}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
