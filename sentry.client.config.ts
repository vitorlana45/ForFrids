import * as Sentry from '@sentry/nextjs';
import { hasAnalyticsConsent } from './src/lib/cookie-consent';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  // Telemetria de performance (tracing) e session replay so rodam com
  // consentimento (banner de cookies / LGPD). A captura de erro segue ativa como
  // legitimo interesse, com texto mascarado. Fail-closed: sem escolha -> desligado.
  // O consentimento passa a valer no proximo carregamento apos "Aceitar".
  const analytics = hasAnalyticsConsent();
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: analytics ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0) : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: analytics ? 0.1 : 0,
    integrations: analytics ? [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })] : [],
  });
}
