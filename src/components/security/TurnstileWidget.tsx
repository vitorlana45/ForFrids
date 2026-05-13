'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({ onVerify, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey) return;

    function tryRender() {
      if (!containerRef.current || widgetIdRef.current) return;
      if (!window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: sitekey!,
        callback: (token: string) => onVerify(token),
        'expired-callback': onExpire,
        theme: 'auto',
      });
    }

    tryRender();
    const interval = window.setInterval(tryRender, 300);

    return () => {
      window.clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, onVerify, onExpire]);

  if (!sitekey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
