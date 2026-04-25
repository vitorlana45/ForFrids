'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DashboardAlerts } from '@/lib/dashboard/alerts';

interface Input {
  pendingApprovalsCount: number;
  readyCapsulesCount: number;
  memorialLikesCount?: number;
}

const POLL_INTERVAL_MS = 45_000;

export function useDashboardAlerts(initial: Input) {
  const [alerts, setAlerts] = useState<DashboardAlerts>({
    pendingApprovalsCount: initial.pendingApprovalsCount,
    readyCapsulesCount: initial.readyCapsulesCount,
    memorialLikesCount: initial.memorialLikesCount ?? 0,
    total: initial.pendingApprovalsCount + initial.readyCapsulesCount,
  });

  const refresh = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;

    try {
      const response = await fetch('/api/dashboard/alerts', {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return;
      const next = (await response.json()) as DashboardAlerts;
      setAlerts(next);
    } catch {
      // Keep the server-rendered count if the refresh fails.
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);

    function handleFocus() {
      refresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') refresh();
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return alerts;
}
