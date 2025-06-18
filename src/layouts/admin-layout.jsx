'use client';

import AdminSidebar from '../components/base/admin-sidebar';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect } from 'react';
import { useState } from 'react';
import { useAuthStore } from '../stores/auth.store';

const AdminLayout = ({ children }) => {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);
  const { isHydrated } = useAuthStore();

  if (!isHydrated) return null;

  return (
    <HeroUIProvider className="w-full">
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className={`flex w-full bg-background text-foreground light dark:bg-black`}>
          <aside className="w-60 flex-none">
            <AdminSidebar />
          </aside>
          <main className="z-10 w-full flex-initial pl-5">{children}</main>
        </div>
      </NextThemesProvider>
    </HeroUIProvider>
  );
};

export default AdminLayout;
