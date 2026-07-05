import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

type EmailProvider = 'smtp' | 'spacemail';

export interface SendEmailInput {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendEmailResult {
  data?: { id?: string } | null;
  error?: unknown;
}

interface EmailClient {
  emails: {
    send(input: SendEmailInput): Promise<SendEmailResult>;
  };
}

let cachedClient: EmailClient | null = null;
let cachedProvider: EmailProvider | null = null;

export const EMAIL_FROM = process.env.EMAIL_FROM
  ?? 'Eterno Pet <noreply@eternopet.com.br>';

function getEmailProvider(): EmailProvider {
  const configured = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (configured === 'smtp' || configured === 'spacemail') {
    return configured;
  }
  if (configured) {
    throw new Error(`Invalid EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER}`);
  }

  if (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SPACEMAIL_USER) {
    return 'smtp';
  }

  return 'spacemail';
}

function boolFromEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false;
  return undefined;
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function createSmtpTransport(provider: EmailProvider): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
  const isSpacemail = provider === 'spacemail';
  const host = process.env.SMTP_HOST ?? (isSpacemail ? 'mail.spacemail.com' : undefined);
  const user = process.env.SMTP_USER ?? process.env.SPACEMAIL_USER;
  const password = process.env.SMTP_PASSWORD ?? process.env.SPACEMAIL_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? (isSpacemail ? '465' : '587'));
  const secure = boolFromEnv(process.env.SMTP_SECURE) ?? port === 465;
  const requireTLS = boolFromEnv(process.env.SMTP_REQUIRE_TLS) ?? (!secure && port === 587);

  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST', host),
    port,
    secure,
    requireTLS,
    auth: {
      user: requireEnv('SMTP_USER', user),
      pass: requireEnv('SMTP_PASSWORD', password),
    },
  });
}

function createSmtpClient(provider: EmailProvider): EmailClient {
  const transporter = createSmtpTransport(provider);

  return {
    emails: {
      async send(input) {
        const info = await transporter.sendMail({
          from: input.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          replyTo: input.replyTo,
        });

        return { data: { id: info.messageId } };
      },
    },
  };
}

export function getEmailClient(): EmailClient {
  const provider = getEmailProvider();
  if (cachedClient && cachedProvider === provider) return cachedClient;

  cachedProvider = provider;
  cachedClient = createSmtpClient(provider);

  return cachedClient;
}
