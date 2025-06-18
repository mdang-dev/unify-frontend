import { Input } from '@/src/components/ui/input';
import avartar from '@/public/images/avatar.png';
import { Search } from 'lucide-react';
import UserHistorySearch from './user-history-search';
import TextSearchHistory from './text-search-history';

const SearchHorizontalToggle = ({ children, isOpen, searchComponentRef }) => {
  const userSearchHistories = [
    {
      id: 1,
      username: 'user123',
      avatar: avartar,
      profile: 'Nguyễn Văn A',
      followers: 12,
    },
    {
      id: 2,
      username: 'user123',
      avatar: avartar,
      profile: 'Nguyễn Văn A',
      followers: 12,
    },
  ];

  return (
    <div>
      <div className={`relative flex h-screen w-full items-center`}>
        <div>{children}</div>
        <div
          ref={searchComponentRef}
          className={`border-l-1 absolute z-50 overflow-hidden rounded-r-lg border-neutral-300 dark:border-neutral-700 dark:bg-black ${
            isOpen && 'animate-fadeScale shadow-right-left'
          } ${
            !isOpen && 'animate-fadeOut'
          } left-full h-screen bg-white transition-all duration-300 ease-in-out`}
          style={{ width: !isOpen ? 0 : 400 }}
        >
          <div className={`mx-4 my-4`}>
            <h1 className={`text-2xl font-bold`}>Search</h1>
            <div className={`relative`}>
              <Input
                type={`search`}
                className={`relative mt-3 border-gray-300 py-5 pl-10 text-black placeholder-black dark:border-neutral-500 dark:text-white`}
                placeholder={'Search'}
              />
              <Search className={`absolute left-2 top-1/2 -translate-y-1/2`} color={`gray`} />
            </div>
          </div>
          <hr className="border-t-1 border-gray-300 dark:border-neutral-500" />
          <div className={`mx-5 mb-3 mt-8 grid gap-7`}>
            {userSearchHistories.map((userSearch) => (
              <UserHistorySearch
                key={userSearch.id}
                avatar={userSearch.avatar}
                username={userSearch.username}
                profile={userSearch.profile}
                followers={userSearch.followers}
              />
            ))}
            <TextSearchHistory text={'nguyenvana'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHorizontalToggle;
