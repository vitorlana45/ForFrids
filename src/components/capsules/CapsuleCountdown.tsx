'use client';

import { useState, useEffect } from 'react';

interface Props {
  openAt: string;
}

export default function CapsuleCountdown({ openAt }: Props) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const diff = new Date(openAt).getTime() - Date.now();
      setDays(diff <= 0 ? 0 : Math.ceil(diff / 86400000));
    }
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [openAt]);

  if (days === null) return null;

  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm">
        <span className="material-symbols-outlined text-base">lock_open</span>
        Pronta para abrir
      </span>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <span className="font-serif text-7xl text-primary leading-none">{days}</span>
      <div className="pb-2 text-on-surface-variant">
        <p className="text-xs font-bold tracking-widest uppercase">dias</p>
        <p className="text-xs">restantes</p>
      </div>
    </div>
  );
}
