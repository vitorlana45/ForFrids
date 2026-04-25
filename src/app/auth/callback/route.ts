import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { welcomeEmail } from '@/lib/emails/welcome';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Password recovery — skip welcome email and go straight to reset page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/redefinir-senha`);
      }

      // Send welcome email only on first sign-in (profile created_at within last 2 min)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, created_at')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const ageMs = Date.now() - new Date(profile.created_at).getTime();
          const isNewUser = ageMs < 2 * 60 * 1000;

          // For OAuth users, fall back to auth metadata if profile fields are empty
          const emailTo = profile.email ?? data.user.email;
          const name =
            profile.full_name ??
            (data.user.user_metadata?.full_name as string | undefined) ??
            (data.user.user_metadata?.name as string | undefined);

          if (isNewUser && emailTo) {
            const { subject, html } = welcomeEmail(name ?? 'Tutor');
            const resend = getResend();
            await resend.emails.send({
              from: FROM_EMAIL,
              to: emailTo,
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
