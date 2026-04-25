import { NextResponse } from 'next/server';
import { petDateReminderEmail } from '@/lib/email/templates';
import { emailFrom, getResend } from '@/lib/email/resend';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Pet, Profile } from '@/types/database';

function saoPauloMonthDay() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${month}-${day}`;
}

function monthDay(value: string | null) {
  if (!value) return null;
  const [, month, day] = value.slice(0, 10).split('-');
  return `${month}-${day}`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = getResend();
  const today = saoPauloMonthDay();

  const { data: petsData, error: petsError } = await admin
    .from('pets')
    .select('*')
    .or('birth_date.not.is.null,death_date.not.is.null');

  if (petsError) {
    return NextResponse.json({ error: petsError.message }, { status: 500 });
  }

  const pets = ((petsData as Pet[] | null) ?? []).filter(
    (pet) => monthDay(pet.birth_date) === today || monthDay(pet.death_date) === today,
  );

  if (pets.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const ownerIds = Array.from(new Set(pets.map((pet) => pet.owner_id)));
  const { data: profilesData, error: profilesError } = await admin
    .from('profiles')
    .select('*')
    .in('id', ownerIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profiles = new Map(
    ((profilesData as Profile[] | null) ?? []).map((profile) => [profile.id, profile]),
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let sent = 0;

  for (const pet of pets) {
    const profile = profiles.get(pet.owner_id);
    if (!profile?.email) continue;

    const isBirthday = monthDay(pet.birth_date) === today;
    const template = petDateReminderEmail({
      tutorName: profile.full_name?.split(' ')[0] ?? 'Tutor',
      petName: pet.name,
      dateLabel: isBirthday ? `Aniversario de ${pet.name}` : `Dia de lembrar ${pet.name}`,
      memorialUrl: `${siteUrl}/memorial/${pet.memorial_slug}`,
    });

    await resend.emails.send({
      from: emailFrom,
      to: profile.email,
      subject: template.subject,
      html: template.html,
    });
    sent += 1;
  }

  return NextResponse.json({ sent });
}
