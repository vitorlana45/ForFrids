import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getServerSession } from '@/lib/auth-server';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extensionFor(type: string) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

function getSupportMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKeyId = process.env.MINIO_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MINIO_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO não configurado para uploads de suporte.');
  }

  return new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function getSupportMinioBucket() {
  const bucket = process.env.MINIO_BUCKET_NAME;
  if (!bucket) throw new Error('MINIO_BUCKET_NAME não configurado.');
  return bucket;
}

function getSupportMinioPublicUrl(key: string) {
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  const bucket = getSupportMinioBucket();
  if (!publicUrl) throw new Error('MINIO_PUBLIC_URL não configurado.');
  return `${publicUrl.replace(/\/+$/, '')}/${bucket}/${key}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  const key = `support/${session.user.id}/ticket-${Date.now()}.${extensionFor(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await getSupportMinioClient().send(new PutObjectCommand({
    Bucket: getSupportMinioBucket(),
    Key: key,
    Body: buffer,
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000',
  }));

  return NextResponse.json({ url: getSupportMinioPublicUrl(key), provider: 'minio' });
}
