import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { cookies } from 'next/headers';

export const getUser = async () => {
  const token = (await cookies()).get(COOKIE_KEYS.AUTH_TOKEN)?.value;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetch(`${baseUrl}/users/my-info`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'force-cache',
  });

  if (!res.ok) return null;

  const user = await res.json();

  return user;
};
