import { redirect } from 'next/navigation';
import { Check, PartyPopper } from 'lucide-react';
import { getServerSession } from '@/lib/auth-server';
import PlanCheckoutButton from '@/components/planos/PlanCheckoutButton';
import { getEffectivePlanServer, planLabel } from '@/lib/plans';
import {
  syncLatestStripeSubscriptionForProfile,
  syncStripeCheckoutSession,
} from '@/lib/billing/stripe-sync';
import { billingError, billingLog } from '@/lib/billing/debug';
import type { PlanId } from '@/types/database';

const PLANS = [
  {
    cardId: 'free' as const,
    id: 'free' as const,
    name: 'Gratuito',
    price: null,
    period: null,
    description: 'Para começar a preservar memórias.',
    features: [
      '1 memorial ativo',
      'Linha do tempo com até 5 momentos',
      'Homenagens de visitantes',
      'Memorial público compartilhável',
    ],
    cta: 'Plano atual',
    highlight: false,
  },
  {
    cardId: 'premium_monthly' as const,
    id: 'premium' as const,
    interval: 'month' as const,
    name: 'Premium',
    price: 'R$ 8,90',
    period: '/mês',
    description: 'Para quem quer expressar mais.',
    features: [
      'Até 5 memoriais ativos',
      'Linha do tempo com até 50 momentos',
      'Diário de Crônicas',
      'Cápsula do Tempo',
      'QR Code do memorial',
    ],
    cta: 'Assinar Premium',
    highlight: true,
  },
  {
    cardId: 'premium_annual' as const,
    id: 'premium' as const,
    interval: 'year' as const,
    name: 'Premium Anual',
    price: 'R$ 89,90',
    period: '/ano',
    description: 'O mesmo Premium, com 2 meses grátis.',
    features: [
      'Tudo do plano Premium',
      '2 meses grátis (≈ R$ 7,49/mês)',
      'Economize R$ 16,90 no ano',
      'Renovação anual',
    ],
    cta: 'Assinar Anual',
    highlight: false,
  },
] as const;

interface Props {
  searchParams: Promise<{ cancelled?: string; session_id?: string; success?: string }>;
}

export default async function PlanosPage({ searchParams }: Props) {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  const user = session.user;

  const { cancelled, session_id: sessionId, success } = await searchParams;
  let checkoutSyncedPlan = null as PlanId | null;
  billingLog('plans.page.start', {
    userId: user.id,
    success,
    cancelled,
    sessionId,
  });

  if (success === 'true' && sessionId) {
    try {
      const result = await syncStripeCheckoutSession(sessionId, user.id);
      checkoutSyncedPlan = result.planId;
      billingLog('plans.page.checkout_sync.result', {
        userId: user.id,
        sessionId,
        synced: result.synced,
        planId: result.planId,
      });
    } catch (error) {
      billingError('plans.page.checkout_sync.error', error, { userId: user.id, sessionId });
      checkoutSyncedPlan = null;
    }
  }

  const effectivePlanId = await getEffectivePlanServer(user.id);
  billingLog('plans.page.effective_plan', { userId: user.id, effectivePlanId });
  let reconciledPlanId = null as PlanId | null;

  if (!checkoutSyncedPlan && effectivePlanId === 'free') {
    try {
      reconciledPlanId = await syncLatestStripeSubscriptionForProfile(user.id);
      billingLog('plans.page.reconcile.result', { userId: user.id, reconciledPlanId });
    } catch (error) {
      billingError('plans.page.reconcile.error', error, { userId: user.id });
      reconciledPlanId = null;
    }
  }

  const currentPlanId = checkoutSyncedPlan ?? reconciledPlanId ?? effectivePlanId;
  billingLog('plans.page.current_plan', {
    userId: user.id,
    checkoutSyncedPlan,
    reconciledPlanId,
    effectivePlanId,
    currentPlanId,
  });
  const successPlanLabel = checkoutSyncedPlan
    ? planLabel(checkoutSyncedPlan)
    : planLabel(currentPlanId);

  return (
    <div className="mx-auto max-w-[1000px] px-6 pb-24 animate-fade-in">
      {success === 'true' && (
        <div className="mb-10 flex items-center gap-4 rounded-2xl border border-primary-fixed-dim/30 bg-primary-fixed px-6 py-4 text-on-primary-fixed">
          <PartyPopper className="h-6 w-6 shrink-0 text-on-primary-fixed" />
          <div>
            <p className="font-semibold text-on-primary-fixed">
              Bem-vindo ao {successPlanLabel}!
            </p>
            <p className="text-sm text-on-primary-fixed-variant">
              {currentPlanId === 'free' && !checkoutSyncedPlan
                ? 'Pagamento recebido. Estamos finalizando a ativacao do seu plano.'
                : 'Seu plano foi ativado. Aproveite todas as funcionalidades.'}
            </p>
          </div>
        </div>
      )}
      {cancelled === 'true' && (
        <div className="mb-10 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-6 py-4">
          <p className="font-semibold text-on-surface">Checkout cancelado</p>
          <p className="text-sm text-on-surface-variant">
            Nenhuma cobranca foi concluida. Voce pode tentar novamente quando quiser.
          </p>
        </div>
      )}
      <header className="mb-14 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          Planos
        </p>
        <h1 className="font-serif text-5xl text-on-surface">Escolha seu plano</h1>
        <p className="mx-auto mt-4 max-w-lg text-on-surface-variant">
          Cada memória merece um espaço adequado. Comece grátis e faça upgrade quando quiser fazer mais.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          // Anual nao e detectavel como "atual" (intervalo nao fica no profile).
          const isCurrent = plan.cardId === 'premium_annual' ? false : plan.id === currentPlanId;

          return (
            <article
              key={plan.cardId}
              className={`relative flex flex-col rounded-3xl border p-8 transition-shadow ${
                plan.highlight
                  ? 'border-primary/30 bg-surface-container shadow-memorial'
                  : 'border-outline-variant/20 bg-surface-container-low'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-xs font-bold text-on-primary shadow-sm">
                  Mais popular
                </span>
              )}

              <div className="mb-6">
                <h2 className="font-serif text-2xl text-on-surface">{plan.name}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.price ? (
                  <p className="font-serif text-on-surface">
                    <span className="text-4xl">{plan.price}</span>
                    <span className="text-base text-on-surface-variant">{plan.period}</span>
                  </p>
                ) : (
                  <p className="font-serif text-4xl text-on-surface">Grátis</p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-on-surface-variant"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="flex items-center justify-center rounded-full border border-outline-variant/40 px-6 py-3 text-sm font-semibold text-on-surface-variant">
                  Plano atual
                </div>
              ) : plan.id !== 'free' ? (
                <PlanCheckoutButton
                  planId={plan.id}
                  interval={'interval' in plan ? plan.interval : 'month'}
                  label={plan.cta}
                  highlight={plan.highlight}
                />
              ) : null}
            </article>
          );
        })}
      </div>

      {/* Feature comparison */}
      <section className="mt-16">
        <h2 className="mb-8 text-center font-serif text-3xl text-on-surface">
          Comparação de recursos
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-outline-variant/20">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container">
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Recurso</th>
                <th className="px-4 py-4 text-center font-semibold text-on-surface-variant">Grátis</th>
                <th className="px-4 py-4 text-center font-semibold text-primary">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 bg-surface-container-lowest">
              {[
                { label: 'Memoriais ativos',        free: '1',    premium: '5'  },
                { label: 'Linha do tempo',           free: '✓',    premium: '✓'  },
                { label: 'Homenagens com moderação', free: '✓',    premium: '✓'  },
                { label: 'QR Code do memorial',      free: '—',    premium: '✓'  },
                { label: 'Cápsula do Tempo',         free: '—',    premium: '✓'  },
                { label: 'Diário de Crônicas',       free: '—',    premium: '✓'  },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="px-6 py-3.5 text-on-surface-variant">{row.label}</td>
                  <td className="px-4 py-3.5 text-center text-on-surface-variant/60">{row.free}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-primary">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-on-surface-variant">
        Pagamentos processados com segurança via Stripe. Todos os planos incluem suporte por e-mail.
      </p>
    </div>
  );
}
