'use server';

import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const getUser = async () => {
  const token = (await cookies()).get(COOKIE_KEYS.AUTH_TOKEN)?.value;

  try {
    const res = await fetch(`http://localhost:8080/users/my-info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'force-cache',
    });

    if (!res.ok) {
      // Return a default user structure instead of null
      return { roles: [] };
    }

    const user = await res.json();
    return user;
  } catch (error) {
    // Return a default user structure on error
    return { roles: [] };
  }
};
