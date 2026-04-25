'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  active?: boolean;
  label?: string;
  fullscreen?: boolean;
}

function PawLoader() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="40" rx="14" ry="12" fill="currentColor" opacity="0.15">
        <animate attributeName="opacity" values="0.15;0.35;0.15" dur="1.4s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="32" cy="40" rx="10" ry="8" fill="currentColor" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.4s" repeatCount="indefinite" />
      </ellipse>
      {[
        { cx: 18, cy: 26, rx: 5, ry: 6, delay: '0s' },
        { cx: 28, cy: 20, rx: 5, ry: 6, delay: '0.15s' },
        { cx: 38, cy: 20, rx: 5, ry: 6, delay: '0.3s' },
        { cx: 48, cy: 26, rx: 5, ry: 6, delay: '0.45s' },
      ].map((toe, i) => (
        <ellipse key={i} cx={toe.cx} cy={toe.cy} rx={toe.rx} ry={toe.ry} fill="currentColor">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="1.4s"
            begin={toe.delay}
            repeatCount="indefinite"
          />
        </ellipse>
      ))}
    </svg>
  );
}

export default function OperationLoader({
  active = true,
  label = 'Carregando',
  fullscreen = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(active);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (active) {
      setVisible(true);
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), 600);
    return () => window.clearTimeout(timeout);
  }, [active]);

  if (!visible) return null;

  const content = (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-surface/90 backdrop-blur-sm'
          : 'absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-3xl bg-surface/85 backdrop-blur-sm'
      }
      role="status"
      aria-live="polite"
    >
      <PawLoader />
      <p className="animate-pulse font-serif text-sm tracking-widest text-on-surface-variant">
        {label}
      </p>
    </div>
  );

  if (fullscreen && mounted) {
    return createPortal(content, document.body);
  }

  return content;
}

export { PawLoader };
