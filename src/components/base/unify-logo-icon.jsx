'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import light from '@/public/images/unify_icon.svg';
import dark from '@/public/images/unify_icon_2.svg';
import { useTheme } from 'next-themes';

const UnifyLogoIcon = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Image
      src={theme === 'dark' ? dark : light}
      alt="UNIFY logo"
      width={100}
      height={100}
      className="mx-auto h-16 w-16 flex-none"
      priority
    />
  );
};

export default UnifyLogoIcon;
