import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { getCookie } from './cookies.util';

export const getUser = async () => {
  const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/my-info`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'force-cache',
  });

  if (!res.ok) return null;

  const user = await res.json();

  return user;
};
