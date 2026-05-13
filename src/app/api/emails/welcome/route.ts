import { NextResponse } from 'next/server';
import { getResend, emailFrom } from '@/lib/email/resend';
import { welcomeEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  const secret = process.env.EMAIL_INTERNAL_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { email?: string; name?: string };
  if (!body.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  const resend = getResend();
  const template = welcomeEmail({ name: body.name ?? 'Tutor', siteUrl });

  await resend.emails.send({
    from: emailFrom,
    to: body.email,
    subject: template.subject,
    html: template.html,
  });

  return NextResponse.json({ sent: true });
}
