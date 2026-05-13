import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { log } from '@/lib/logger';

export function getStorageClient(): S3Client {
  if (process.env.STORAGE_PROVIDER === 'minio') {
    return new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function getPublicUrl(key: string): string {
  if (process.env.STORAGE_PROVIDER === 'minio') {
    return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${key}`;
  }
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export function getBucketName(): string {
  if (process.env.STORAGE_PROVIDER === 'minio') {
    return process.env.MINIO_BUCKET_NAME!;
  }
  return process.env.R2_BUCKET_NAME!;
}

function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  return value.replace(/\/+$/, '');
}

export function parsePublicUrl(publicUrl: string): { bucket: string; key: string } | null {
  if (process.env.STORAGE_PROVIDER === 'minio') {
    const endpoint = normalizeBaseUrl(process.env.MINIO_ENDPOINT);
    const publicUrlBase = normalizeBaseUrl(process.env.MINIO_PUBLIC_URL);
    const candidates = [publicUrlBase, endpoint].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      const prefix = candidate + '/';
      if (!publicUrl.startsWith(prefix)) continue;
      const rest = decodeURIComponent(publicUrl.slice(prefix.length).split('?')[0]);
      const slash = rest.indexOf('/');
      if (slash === -1) return null;
      return { bucket: rest.slice(0, slash), key: rest.slice(slash + 1) };
    }

    return null;
  }

  const r2BaseUrl = normalizeBaseUrl(process.env.R2_PUBLIC_URL);
  if (!r2BaseUrl) return null;
  const prefix = r2BaseUrl + '/';
  if (!publicUrl.startsWith(prefix)) return null;
  const key = decodeURIComponent(publicUrl.slice(prefix.length).split('?')[0]);
  return { bucket: process.env.R2_BUCKET_NAME!, key };
}

export function getObjectKeyFromPublicUrl(publicUrl: string): string | null {
  return parsePublicUrl(publicUrl)?.key ?? null;
}

export function publicUrlMatchesKeyPrefix(publicUrl: string, keyPrefix: string): boolean {
  const parsed = parsePublicUrl(publicUrl);
  return Boolean(parsed && parsed.bucket === getBucketName() && parsed.key.startsWith(keyPrefix));
}

export async function deletePublicObject(publicUrl: string): Promise<{ error?: string; skipped?: boolean }> {
  const parsed = parsePublicUrl(publicUrl);
  if (!parsed) {
    log.warn('[storage:delete] URL não reconhecida — skipped', { publicUrl, provider: process.env.STORAGE_PROVIDER });
    return { skipped: true };
  }

  const { bucket, key } = parsed;
  log.debug('[storage:delete] tentando deletar', { bucket, key });

  try {
    await getStorageClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
    log.info('[storage:delete] deletado com sucesso', { bucket, key });
    return {};
  } catch (error) {
    log.error('[storage:delete] falha ao deletar', { bucket, key, error });
    return { error: 'Nao foi possivel remover a foto do bucket.' };
  }
}
