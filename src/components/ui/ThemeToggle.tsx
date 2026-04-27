'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

interface Props {
  className?: string;
  iconSize?: string;
}

export default function ThemeToggle({ className, iconSize = 'h-5 w-5' }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-10 w-10" />;

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={
        className ??
        'flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary'
      }
      aria-label="Alternar tema"
    >
      {resolvedTheme === 'dark' ? <Sun className={iconSize} /> : <Moon className={iconSize} />}
    </button>
  );
}
