'use client';
import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserHydrator from './modules/user-hydrator';
import { ToastProvider } from '@heroui/toast';
import { ThemeProvider, useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import CaptchaScreen from './components/base/captcha-screen';
import { useReportMonitoring } from './hooks/use-report-monitoring';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
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

function AppContent({ children }) {
  // Initialize report monitoring
  useReportMonitoring();
  
  return children;
}

export default function QueryProvider({ children }) {
  const client = getQueryClient();
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verified') || null;
    }
    return null;
  });
  const isProd = process.env.NODE_ENV === 'production';

  const handleSetToken = (newToken) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('verified', newToken);
    }
    setToken(newToken);
  };

  if (!token && isProd) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CaptchaScreen setToken={handleSetToken} />
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <UserHydrator />
        <AppContent>
          {children}
        </AppContent>
        <ToastProvider placement="top-center" />
      </ThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
