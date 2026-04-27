/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
      // Supabase Storage (legado — para imagens antigas ainda em migração)
      {
        protocol: 'https',
        hostname: 'sozfyxnhzudreqxgcbvr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
