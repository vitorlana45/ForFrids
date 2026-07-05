import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { EMAIL_FROM, getEmailClient } from './email/client';
import { verificationEmail, passwordResetEmail } from './emails/auth-emails';
import { welcomeEmail } from './emails/welcome';
import { log } from './logger';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.1.3:3000',
    'http://192.168.1.3:3001',
  ],
  secret: process.env.BETTER_AUTH_SECRET!,

  advanced: {
    database: {
      generateId: 'uuid',
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/request-password-reset': { window: 300, max: 3 },
      '/reset-password': { window: 300, max: 5 },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Best-effort: lançar erro aqui diferenciaria emails cadastrados dos não
    // cadastrados quando o SMTP falha (enumeração de contas).
    sendResetPassword: async ({ user, url }) => {
      try {
        const email = getEmailClient();
        const { subject, html } = passwordResetEmail(url);
        const result = await email.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
        log.info('[auth:reset] email de redefinicao enviado', { messageId: result.data?.id ?? null });
      } catch (error) {
        log.error('[auth:reset] falha ao enviar email de redefinicao', { error });
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        const email = getEmailClient();
        const { subject, html } = verificationEmail(url);
        await email.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
      } catch (error) {
        log.error('[auth:verificacao] falha ao enviar email de verificacao', { error });
      }
    },
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  user: {
    modelName: 'profile',
    fields: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      full_name: { type: 'string', required: false, input: true },
      avatar_url: { type: 'string', required: false, input: false },
      guardian_title: { type: 'string', required: false, input: false },
      bio: { type: 'string', required: false, input: false },
      plan_id: { type: 'string', required: false, input: false, defaultValue: 'free' },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const email = getEmailClient();
            const { subject, html } = welcomeEmail(user.name ?? user.email);
            await email.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
          } catch (error) {
            log.error('[auth:welcome] falha ao enviar email de boas-vindas', { error });
          }
        },
      },
    },
  },
});
