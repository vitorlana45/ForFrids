'use client';

import { useTransition } from 'react';
import { createCheckoutSession } from '@/lib/actions/stripe';
import { useToast } from '@/components/ui/toast';
import type { BillingInterval, PaidPlanId } from '@/lib/payments';

interface Props {
  planId: PaidPlanId;
  interval?: BillingInterval;
  label: string;
  highlight?: boolean;
}

export default function PlanCheckoutButton({ planId, interval = 'month', label, highlight }: Props) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    startTransition(async () => {
      const result = await createCheckoutSession(planId, interval);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        highlight
          ? 'bg-primary text-on-primary hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim'
          : 'border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'
      }`}
    >
      {isPending ? 'Redirecionando...' : label}
    </button>
  );
}
