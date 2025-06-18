'use client';

import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import MoonIcon from './_components/moon-icon';
import SunIcon from './_components/sun-icon';

export default function ModeSwitch({ text = 'Dark Mode', className = '' }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p>{text}</p>
      <Switch
        className=""
        defaultSelected
        color="success"
        size="lg"
        thumbIcon={({ isSelected, className }) =>
          isSelected ? <MoonIcon className={className} /> : <SunIcon className={className} />
        }
        isSelected={theme === 'dark'}
        onValueChange={() => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
        }}
      ></Switch>
    </div>
  );
}
