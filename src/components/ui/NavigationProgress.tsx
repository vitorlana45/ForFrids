'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { PawLoader } from './OperationLoader';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname && url.search === window.location.search) return;
      } catch {
        return;
      }

      setPending(true);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  if (!mounted || !pending) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-surface/85 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <PawLoader />
      <p className="animate-pulse font-serif text-sm tracking-widest text-on-surface-variant">
        Carregando
      </p>
    </div>,
    document.body,
  );
}
