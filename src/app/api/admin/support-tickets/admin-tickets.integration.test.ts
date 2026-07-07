import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' } });
vi.mock('@/lib/email/client', () => ({
  EMAIL_FROM: 'Teste <teste@example.com>',
  getEmailClient: () => ({ emails: { send: sendMock } }),
}));

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

  describe('POST reply', () => {
    it('envia email, persiste reply e muda status', async () => {
      const { POST } = await import('./[id]/reply/route');
      const res = await POST(
        authedRequest(`http://test/api/admin/support-tickets/${ticketId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message: 'Olá! Corrigimos o problema.', status: 'resolved' }),
        }),
        { params: Promise.resolve({ id: ticketId }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reply.sent_to).toBe('teste-admin@example.com');
      expect(body.ticket.status).toBe('resolved');
      expect(sendMock).toHaveBeenCalledOnce();

      const replies = await prisma.supportTicketReply.findMany({ where: { ticket_id: ticketId } });
      expect(replies).toHaveLength(1);
    });

    it('nao persiste reply quando o envio falha', async () => {
      sendMock.mockRejectedValueOnce(new Error('smtp down'));
      const { POST } = await import('./[id]/reply/route');
      const res = await POST(
        authedRequest(`http://test/api/admin/support-tickets/${ticketId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message: 'segunda tentativa' }),
        }),
        { params: Promise.resolve({ id: ticketId }) },
      );
      expect(res.status).toBe(502);
      const replies = await prisma.supportTicketReply.findMany({ where: { ticket_id: ticketId } });
      expect(replies).toHaveLength(1); // só a do teste anterior
    });

    it('valida mensagem vazia com 400', async () => {
      const { POST } = await import('./[id]/reply/route');
      const res = await POST(
        authedRequest(`http://test/api/admin/support-tickets/${ticketId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message: '' }),
        }),
        { params: Promise.resolve({ id: ticketId }) },
      );
      expect(res.status).toBe(400);
    });
  });
});
