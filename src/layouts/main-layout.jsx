'use client';

import Sidebar from '../components/base/sidebar';
import { HeroUIProvider } from '@heroui/react';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import IncomingCall from '../modules/incoming-call';

export default function MainLayout({ children }) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  const { isHydrated } = useAuthStore();

  if (!isHydrated) return null;

  return (
    <HeroUIProvider className="w-full">
      <div className="flex w-full bg-background text-foreground light dark:bg-black">
        <aside className="z-50 w-20 flex-none">
          <div className={`fixed w-20`}>
            <Sidebar />
          </div>
        </aside>
        <main className="relative h-screen w-full flex-initial overflow-y-auto scrollbar-hide">
          {children}
          <IncomingCall/>
        </main>
      </div>
    </HeroUIProvider>
  );
}
