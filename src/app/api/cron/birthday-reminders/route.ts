import { NextResponse } from 'next/server';
import { petBirthdayEmail, petAnniversaryEmail } from '@/lib/email/templates';
import { EMAIL_FROM, getEmailClient } from '@/lib/email/client';
import { prisma } from '@/lib/prisma';
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

function monthDay(value: string | Date | null) {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString() : value;
  const [, month, day] = str.slice(0, 10).split('-');
  return `${month}-${day}`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = getEmailClient();
  const today = saoPauloMonthDay();

  const allPets = await prisma.pet.findMany({
    where: {
      OR: [
        { birth_date: { not: null } },
        { death_date: { not: null } },
      ],
    },
  });

  const pets = (allPets as unknown as Pet[]).filter(
    (pet) => monthDay(pet.birth_date) === today || monthDay(pet.death_date) === today,
  );

  if (pets.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const ownerIds = Array.from(new Set(pets.map((pet) => pet.owner_id)));
  const profilesData = await prisma.profile.findMany({
    where: { id: { in: ownerIds } },
  });

  const profiles = new Map(
    (profilesData as unknown as Profile[]).map((profile) => [profile.id, profile]),
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  let sent = 0;

  const currentYear = new Date().getFullYear();

  for (const pet of pets) {
    const profile = profiles.get(pet.owner_id);
    if (!profile?.email) continue;

    const isBirthday = monthDay(pet.birth_date) === today;
    const tutorName = profile.full_name?.split(' ')[0] ?? 'Tutor';
    const memorialUrl = `${siteUrl}/memorial/${pet.memorial_slug}`;

    let template;
    if (isBirthday) {
      const birthYear = pet.birth_date ? new Date(pet.birth_date).getFullYear() : null;
      const ageYears = birthYear ? currentYear - birthYear : null;
      template = petBirthdayEmail({ tutorName, petName: pet.name, memorialUrl, ageYears });
    } else {
      const deathYear = pet.death_date ? new Date(pet.death_date).getFullYear() : null;
      const yearsSince = deathYear ? currentYear - deathYear : null;
      template = petAnniversaryEmail({ tutorName, petName: pet.name, memorialUrl, yearsSince });
    }

    await email.emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: template.subject,
      html: template.html,
    });
    sent += 1;
  }

  return NextResponse.json({ sent });
}
