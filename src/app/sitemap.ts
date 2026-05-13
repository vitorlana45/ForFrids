import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br').replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/entrar`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/cadastrar`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/termos`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  let memorialRoutes: MetadataRoute.Sitemap = [];
  try {
    const pets = await prisma.pet.findMany({
      where: { is_public: true, moderation_status: { not: 'blocked' } },
      select: { memorial_slug: true, updated_at: true },
    });
    memorialRoutes = pets.map((pet) => ({
      url: `${base}/memorial/${pet.memorial_slug}`,
      lastModified: pet.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // sitemap should not break if DB is momentarily unavailable
  }

  return [...staticRoutes, ...memorialRoutes];
}
