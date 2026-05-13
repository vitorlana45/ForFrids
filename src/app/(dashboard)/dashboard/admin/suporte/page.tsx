import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { isAdminEmail } from '@/lib/admin/user';
import { prisma } from '@/lib/prisma';

async function updateStatus(formData: FormData) {
  'use server';

  const session = await getServerSession();
  if (!session || !isAdminEmail(session.user.email)) {
    return;
  }

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !['open', 'in_progress', 'resolved'].includes(status)) return;

  await prisma.supportTicket.update({
    where: { id },
    data: { status: status as 'open' | 'in_progress' | 'resolved' },
  });

  revalidatePath('/dashboard/admin/suporte');
}

const statusLabel: Record<'open' | 'in_progress' | 'resolved', string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
};

export default async function AdminSupportPage() {
  const session = await getServerSession();
  if (!session) redirect('/entrar');
  if (!isAdminEmail(session.user.email)) redirect('/dashboard');

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { created_at: 'desc' },
    take: 150,
    include: {
      user: { select: { email: true, full_name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 animate-fade-in">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Admin</p>
        <h1 className="font-serif text-4xl text-on-surface">Tickets de suporte</h1>
      </header>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">{ticket.type}</p>
                <h2 className="font-serif text-2xl text-on-surface">{ticket.title}</h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {new Date(ticket.created_at).toLocaleString('pt-BR')} · {ticket.user?.full_name ?? ticket.user?.email ?? ticket.contact_email ?? 'anônimo'}
                </p>
              </div>
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {statusLabel[ticket.status]}
              </span>
            </div>

            <p className="mb-3 whitespace-pre-wrap text-sm leading-7 text-on-surface" style={{ overflowWrap: 'anywhere' }}>
              {ticket.message}
            </p>

            {(ticket.steps || ticket.expected_result || ticket.actual_result) && (
              <div className="mb-3 space-y-2 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
                {ticket.steps && <p><span className="font-semibold text-on-surface">Passos:</span> {ticket.steps}</p>}
                {ticket.expected_result && <p><span className="font-semibold text-on-surface">Esperado:</span> {ticket.expected_result}</p>}
                {ticket.actual_result && <p><span className="font-semibold text-on-surface">Obtido:</span> {ticket.actual_result}</p>}
              </div>
            )}

            {ticket.image_url && (
              <a href={ticket.image_url} target="_blank" rel="noreferrer" className="mb-3 inline-block text-sm font-semibold text-primary hover:underline">
                Abrir imagem anexada
              </a>
            )}

            <form action={updateStatus} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={ticket.id} />
              <button type="submit" name="status" value="open" className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container">
                Marcar aberto
              </button>
              <button type="submit" name="status" value="in_progress" className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container">
                Em andamento
              </button>
              <button type="submit" name="status" value="resolved" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary hover:bg-[#3d4d41]">
                Resolver
              </button>
            </form>
          </article>
        ))}

        {tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-outline-variant px-6 py-10 text-center text-on-surface-variant">
            Nenhum ticket recebido ainda.
          </div>
        )}
      </div>
    </div>
  );
}
