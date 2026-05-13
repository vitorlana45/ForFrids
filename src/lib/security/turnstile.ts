const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const turnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
