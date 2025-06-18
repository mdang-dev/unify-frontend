'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserHydrator from './modules/user-hydrator';
import { ToastProvider } from '@heroui/toast';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProvider } from 'next-themes';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  });
}

let browserQueryClient;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function QueryProvider({ children }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <UserHydrator />
        <ToastProvider placement="top-right" />
        {children}
      </ThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
