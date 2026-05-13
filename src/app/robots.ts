import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/memorial/'],
        disallow: ['/dashboard', '/api/', '/onboarding'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
