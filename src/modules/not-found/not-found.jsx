'use client';

import { useEffect, useState } from 'react';

export default function NotFound() {
  const [onMounted, setOnMounted] = useState(false);
  useEffect(() => setOnMounted(true), []);
  if (!onMounted) return null;

  return (
    <div className="flex h-screen w-full">
      <div className="m-auto">
        <div className="p-10 text-center">
          <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
        </div>
      </div>
    </div>
  );
}
