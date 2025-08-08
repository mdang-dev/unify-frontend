import { Input } from '@/src/components/ui/input';
import { useSearch } from '@/src/hooks/use-search';
import { Search, AlertCircle, Clock, X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import UserHistorySearch from './user-history-search';

const SearchHorizontalToggle = ({ children, isOpen, searchComponentRef }) => {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    searchHistory,
    clearSearchHistory,
    removeFromHistory,
    addUserInfoToHistory,
    searchUserInfoHistory,
    removeUserInfoFromHistory,
  } = useSearch();

  const handleUserClick = (user) => {
    addUserInfoToHistory(user);
    router.push(`/others-profile/${user?.username}`);
  };

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
  };

  const handleRemoveUserHistory = (user) => {
    removeUserInfoFromHistory(user?.username);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
  };

  const handleRemoveFromHistory = (e, query) => {
    e.stopPropagation();
    removeFromHistory(query);
  };

  return (
    <div>
      <div className={`relative flex h-screen w-full items-center`}>
        <div>{children}</div>
        <div
          ref={searchComponentRef}
          className={`absolute z-50 overflow-hidden rounded-r-lg border-l border-neutral-300 dark:border-transparent dark:bg-neutral-900 ${
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
                className={`relative mt-3 border-gray-300 py-5 pl-10 text-black placeholder-black dark:border-transparent dark:text-white`}
                placeholder={'Search users...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className={`absolute left-2 top-1/2 -translate-y-1/2`} color={`gray`} />
            </div>
          </div>
        <hr className="border-t border-gray-300 dark:border-transparent" />

          <div className="h-[calc(100vh-120px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : error ? (
              <div className="flex h-32 flex-col items-center justify-center text-red-500">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p>{error}</p>
              </div>
            ) : searchQuery ? (
              // Search Results
              <>
                {searchResults.length > 0 ? (
                  <div className="mx-5 mb-3 mt-8">
                    <h2 className="mb-4 text-lg font-semibold">Search Results</h2>
                    <div className="grid gap-4">
                      {searchResults.map((user, index) => (
                        <UserHistorySearch
                          key={index}
                          user={user}
                          onClick={() => handleUserClick(user)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-gray-500">
                    No users found
                  </div>
                )}
              </>
            ) : (
              // Search History
              <div className="mx-5 mb-3 mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Clock className="h-5 w-5" />
                    Recent Searches
                  </h2>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </button>
                  )}
                </div>

                {searchHistory.length > 0 ? (
                  <div className="grid gap-2">
                    {searchHistory.map((query, index) => (
                      <div
                        key={index}
                        className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
                        onClick={() => handleHistoryClick(query)}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{query}</span>
                        </div>
                        <button
                          onClick={(e) => handleRemoveFromHistory(e, query)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="grid gap-4">
                      {searchUserInfoHistory.map((user, index) => (
                        <UserHistorySearch
                          key={index}
                          user={user}
                          onClick={() => handleUserClick(user)}
                          onDelete={() => handleRemoveUserHistory(user)}
                          isHistory
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">No recent searches</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHorizontalToggle;
