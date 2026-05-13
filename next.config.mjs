import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', '@prisma/instrumentation'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Silencia "Critical dependency" do OpenTelemetry usado pelo @sentry/node
      config.ignoreWarnings = [
        ...(config.ignoreWarnings ?? []),
        { module: /@opentelemetry\/instrumentation/ },
        { module: /require-in-the-middle/ },
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      // MinIO (dev e staging — Coolify)
      {
        protocol: 'http',
        hostname: 's3.lanadev.com.br',
        port: '9000',
        pathname: '/**',
      },
      // MinIO local (docker-compose)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      // R2 (produção — Cloudflare via cloudflarestorage.com)
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      // R2 (produção — Cloudflare via r2.dev CDN público)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

const sentryEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;
