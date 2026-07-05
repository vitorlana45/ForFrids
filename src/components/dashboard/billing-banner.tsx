import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export async function BillingBanner({ userId }: { userId: string }) {
  const sub = await prisma.subscription.findFirst({
    where: { profile_id: userId, status: { in: ['active', 'trialing', 'past_due'] } },
    orderBy: { created_at: 'desc' },
    select: { status: true, cancel_at_period_end: true, current_period_end: true },
  });
  if (!sub) return null;

  if (sub.status === 'past_due') {
    return (
      <div className="bg-secondary/10 border border-secondary/30 text-on-surface rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Não conseguimos renovar sua assinatura. Atualize sua forma de pagamento
          para manter tudo ativo.
        </p>
        <Link href="/dashboard/planos" className="text-sm font-medium text-primary underline underline-offset-4">
          Atualizar pagamento
        </Link>
      </div>
    );
  }

  if (sub.cancel_at_period_end && sub.current_period_end) {
    const until = sub.current_period_end.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return (
      <div className="bg-surface-container border border-surface-variant text-on-surface-variant rounded-2xl px-6 py-4 mb-6">
        <p className="text-sm">
          Seu Premium continua ativo até {until}. Se mudar de ideia,{' '}
          <Link href="/dashboard/planos" className="text-primary underline underline-offset-4">reative quando quiser</Link>.
        </p>
      </div>
    );
  }

  return null;
}
