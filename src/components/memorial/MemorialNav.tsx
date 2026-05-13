'use client';

import { useEffect, useState } from 'react';

export interface MemorialNavItem {
  id: string;
  label: string;
  icon?: string;
}

interface Props {
  items: MemorialNavItem[];
  variant?: 'desktop' | 'mobile';
}

export default function MemorialNav({ items, variant = 'desktop' }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;

    const sections = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    function pickActive() {
      const viewportMidline = window.innerHeight * 0.3;
      let bestId = sections[0].id;
      let bestDistance = Infinity;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        const distance = Math.abs(rect.top - viewportMidline);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = section.id;
        }
      }

      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      if (atBottom) bestId = sections[sections.length - 1].id;

      setActiveId(bestId);
    }

    pickActive();
    window.addEventListener('scroll', pickActive, { passive: true });
    window.addEventListener('resize', pickActive);
    return () => {
      window.removeEventListener('scroll', pickActive);
      window.removeEventListener('resize', pickActive);
    };
  }, [items]);

  function handleClick(id: string) {
    setActiveId(id);
  }

  if (variant === 'mobile') {
    return (
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-outline-variant/20 bg-surface/80 px-4 pb-2 backdrop-blur-md md:hidden">
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => handleClick(item.id)}
              className={`flex flex-col items-center justify-center transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-serif text-[11px] tracking-wide">{item.label}</span>
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {items.map(item => {
        const isActive = item.id === activeId;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => handleClick(item.id)}
            className={`pb-1 font-serif transition-colors ${
              isActive
                ? 'border-b-2 border-primary-container font-medium text-primary-container'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
