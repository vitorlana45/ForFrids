import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Carrega .env.local (DATABASE_URL do dev + ADMIN_API_TOKEN)
function loadEnvLocal() {
  const raw = readFileSync(resolve(__dirname, '../../../../../.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const TOKEN = process.env.ADMIN_API_TOKEN!;

function authedRequest(url: string, init?: RequestInit) {
  return new Request(url, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...init?.headers },
  });
}

describe('admin support-tickets [id]', () => {
  let ticketId: string;
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma;
    const ticket = await prisma.supportTicket.create({
      data: {
        type: 'bug',
        title: 'Teste integração detalhe',
        message: 'mensagem de teste',
        contact_email: 'teste-admin@example.com',
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.supportTicket.deleteMany({ where: { id: ticketId } });
  });

  it('retorna 401 sem token', async () => {
    const { GET } = await import('./[id]/route');
    const res = await GET(new Request(`http://test/api/admin/support-tickets/${ticketId}`), {
      params: Promise.resolve({ id: ticketId }),
    });
    expect(res.status).toBe(401);
  });

  it('retorna detalhe com replies vazio', async () => {
    const { GET } = await import('./[id]/route');
    const res = await GET(authedRequest(`http://test/api/admin/support-tickets/${ticketId}`), {
      params: Promise.resolve({ id: ticketId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticket.id).toBe(ticketId);
    expect(body.ticket.title).toBe('Teste integração detalhe');
    expect(body.ticket.replies).toEqual([]);
  });

  it('retorna 404 para id inexistente', async () => {
    const { GET } = await import('./[id]/route');
    const missing = '00000000-0000-0000-0000-000000000000';
    const res = await GET(authedRequest(`http://test/api/admin/support-tickets/${missing}`), {
      params: Promise.resolve({ id: missing }),
    });
    expect(res.status).toBe(404);
  });
});
