'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { authQueryApi } from '../apis/auth/query/auth.query.api';
import { getCookie } from '../utils/cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const useUser = () => {
  const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);

  const { data, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    queryFn: authQueryApi.getMyInfo,
    enabled: !!token,
  });

  return { user: data, isLoading, isError };
};
