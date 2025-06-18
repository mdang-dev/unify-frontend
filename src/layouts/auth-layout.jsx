'use client';

import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useState } from 'react';
import { useEffect } from 'react';

export default function AuthLayout({ children }) {
  const [onMounted, setOnMounted] = useState(false);

  useEffect(() => {
    setOnMounted(true);
  }, []);

  if (!onMounted) return null;

  return (
    <HeroUIProvider className="w-full">
      <div className={`flex h-screen w-full justify-center`}>{children}</div>
    </HeroUIProvider>
  );
}
