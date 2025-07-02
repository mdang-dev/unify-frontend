import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userQueryApi } from '../apis/user/query/user.query.api';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { STORAGE_KEYS } from '../constants/storage-keys.constant';
import { useDebounce } from './use-debounce';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [searchHistory, setSearchHistory] = useState([]);
  const [searchUserInfoHistory, setSearchUserInfoHistory] = useState([]);
  const [hasLoadedLocalStorage, setHasLoadedLocalStorage] = useState(false);

  // Load from localStorage once on mount
  useEffect(() => {
    const savedQueryHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
    setSearchHistory(savedQueryHistory);

    const savedUserInfoHistory = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SEARCH_USER_INFO_HISTORY) || '[]'
    );
    setSearchUserInfoHistory(savedUserInfoHistory);

    setHasLoadedLocalStorage(true);
  }, []);

  // Save to localStorage only after loading done
  useEffect(() => {
    if (!hasLoadedLocalStorage) return;
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory));
  }, [searchHistory, hasLoadedLocalStorage]);

  useEffect(() => {
    if (!hasLoadedLocalStorage) return;
    localStorage.setItem(
      STORAGE_KEYS.SEARCH_USER_INFO_HISTORY,
      JSON.stringify(searchUserInfoHistory)
    );
  }, [searchUserInfoHistory, hasLoadedLocalStorage]);

  const {
    data: searchResults = [],
    isFetching: isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.SEARCH_USERS, debouncedSearchQuery],
    queryFn: () => userQueryApi.searchUsers(debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim(),
  });

  // Update string history
  useEffect(() => {
    const trimmed = debouncedSearchQuery.trim();
    if (!trimmed || !searchResults.length) return;

    setSearchHistory((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 5);
    });
  }, [searchResults, debouncedSearchQuery]);

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setSearchUserInfoHistory([]);
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SEARCH_USER_INFO_HISTORY);
  };

  const removeFromHistory = (query) => {
    setSearchHistory((prev) => prev.filter((item) => item !== query));
  };

  const addUserInfoToHistory = (user) => {
    const userInfo = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar?.url,
    };

    setSearchUserInfoHistory((prev) => {
      const exists = prev.some((u) => u.username === user.username);
      if (exists) return prev;
      return [userInfo, ...prev.filter((u) => u.username !== user.username)].slice(0, 10);
    });
  };

  const removeUserInfoFromHistory = (username) => {
    setSearchUserInfoHistory((prev) => prev.filter((user) => user.username !== username));
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    searchResults,
    isLoading,
    error: error?.response?.data?.message || error?.message,
    searchHistory,
    searchUserInfoHistory,
    clearSearchHistory,
    removeFromHistory,
    removeUserInfoFromHistory,
    addUserInfoToHistory,
  };
};
