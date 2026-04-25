import { Resend } from 'resend';

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  return new Resend(apiKey);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Eterno Pet <noreply@eternopet.com.br>';
