'use client';

import AdminSidebar from '../components/base/admin-sidebar';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect } from 'react';
import { useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';

const AdminLayout = ({ children }) => {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);
  const { isHydrated } = useAuthStore();

  if (!isHydrated) return null;

  return (
    <HeroUIProvider className="w-full">
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
        <SidebarProvider>
          <div className={`flex w-full bg-background text-foreground light dark:bg-black`}>
            <AdminSidebar />
            <main className="z-10 w-full flex-initial">
              <div className="flex h-16 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <div className="flex-1" />
              </div>
              <div className="p-4">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
};

export default AdminLayout;
