// Consentimento de cookies (LGPD). Guardado num cookie first-party para ser
// legivel tanto pela UI quanto pela config do Sentry (que le no boot do client).
// Cookies essenciais (sessao, Turnstile, Stripe) sao isentos; o consentimento
// aqui cobre a telemetria nao-essencial (Sentry: tracing + session replay).

export const COOKIE_CONSENT_COOKIE = 'ep_cookie_consent';
// Bump quando o escopo de cookies mudar de forma relevante -> re-pergunta.
export const COOKIE_CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 ano

export type ConsentChoice = 'accepted' | 'rejected';

export interface CookieConsent {
  choice: ConsentChoice;
  version: number;
  at: string; // ISO
}

function readRawCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCookieConsent(): CookieConsent | null {
  const raw = readRawCookie(COOKIE_CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null; // versao antiga -> re-perguntar
    if (parsed.choice !== 'accepted' && parsed.choice !== 'rejected') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: ConsentChoice): CookieConsent {
  const consent: CookieConsent = {
    choice,
    version: COOKIE_CONSENT_VERSION,
    at: new Date().toISOString(),
  };
  if (typeof document !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const value = encodeURIComponent(JSON.stringify(consent));
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: consent }));
  }
  return consent;
}

// Consentimento para telemetria/analytics nao-essencial (Sentry tracing/replay).
export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.choice === 'accepted';
}
