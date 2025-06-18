'use client';

import { useUser } from '@/src/hooks/use-user';
import { useAuthStore } from '@/src/stores/auth.store';
import { useEffect } from 'react';

export default function UserHydrator() {
  const { setUser } = useAuthStore();
  const { user } = useUser();
  useEffect(() => {
    if (user) setUser(user);
  }, [setUser, user]);
  return null;
}
