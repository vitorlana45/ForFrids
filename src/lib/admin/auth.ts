import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export function authorizeAdmin(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: 'Admin API disabled (ADMIN_API_TOKEN não configurado).' }, { status: 503 });
  }

  const header = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provided = header.slice(prefix.length);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
