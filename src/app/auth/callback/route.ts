import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { welcomeEmail } from '@/lib/emails/welcome';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Send welcome email only on first confirmation (profile created_at within last 2 min)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, created_at')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const ageMs = Date.now() - new Date(profile.created_at).getTime();
          const isNewUser = ageMs < 2 * 60 * 1000;

          if (isNewUser && profile.email) {
            const { subject, html } = welcomeEmail(profile.full_name ?? 'Tutor');
            await resend.emails.send({
              from: FROM_EMAIL,
              to: profile.email,
              subject,
              html,
            });
          }
        }
      } catch {
        // Email failure must never break the auth flow
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/entrar?erro=confirmacao`);
}
