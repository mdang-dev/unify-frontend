import debounce from 'lodash/debounce';
import { useEffect, useState } from 'react';

export const useDebounce = (isFetching, delayMs = 300) => {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const debouncedSetLoading = debounce((value) => {
      setShowLoading(value);
    }, delayMs);

    debouncedSetLoading(isFetching);

    return () => {
      debouncedSetLoading.cancel();
    };
  }, [isFetching, delayMs]);

  return showLoading;
};
