import { Geist, Geist_Mono, Montserrat } from 'next/font/google';
import '../styles/globals.css';
import '../styles/fonts.css'; // Import optimized font loading
import QueryProvider from '../query-client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

export default async function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.className} flex w-full`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
