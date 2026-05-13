import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import {
  deletePublicObject,
  getBucketName,
  getPublicUrl,
  getStorageClient,
  parsePublicUrl,
} from '@/lib/storage/client';
import { AccessDeniedError, assertFeatureAccess, assertOwnsPet } from '@/lib/security/access';
import {
  assertUploadAllowed,
  recordUploadEvent,
  UploadLimitExceededError,
  type UploadScope,
} from '@/lib/security/upload-limits';
import { log } from '@/lib/logger';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_FILE_RE = /^[a-zA-Z0-9._-]+$/;

async function timelineEntryBelongsToPet(entryId: string | undefined, petId: string) {
  if (!entryId || !UUID_RE.test(entryId)) return false;
  const entry = await prisma.timelineEntry.findUnique({
    where: { id: entryId },
    select: { pet_id: true },
  });
  return entry?.pet_id === petId;
}

async function authorizePath(userId: string, path: string) {
  if (!isSafePath(path)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const parts = path.split('/');
  const [scope, ownerId, resourceId] = parts;
  if (ownerId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    if (scope === 'profiles') {
      if (parts.length !== 3 || !parts[2].startsWith('avatar-')) {
        return NextResponse.json({ error: 'Invalid profile upload path' }, { status: 400 });
      }
    } else if (scope === 'pets') {
      if (!resourceId || !UUID_RE.test(resourceId)) {
        return NextResponse.json({ error: 'Invalid pet id' }, { status: 400 });
      }

      await assertOwnsPet(userId, resourceId);

      const [, , petId, kind, entryId] = parts;
      const isAvatarUpload = parts.length === 4 && parts[3].startsWith('avatar-');
      const isTimelineUpload = parts.length === 6 && kind === 'timeline';

      if (isTimelineUpload) {
        if (!(await timelineEntryBelongsToPet(entryId, petId))) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (!isAvatarUpload) {
        return NextResponse.json({ error: 'Invalid pet upload path' }, { status: 400 });
      }
    } else if (scope === 'chronicles') {
      if (parts.length !== 4 || !resourceId || !UUID_RE.test(resourceId)) {
        return NextResponse.json({ error: 'Invalid chronicle upload path' }, { status: 400 });
      }

      await assertFeatureAccess(userId, 'chronicles');
      await assertOwnsPet(userId, resourceId);
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    throw error;
  }

  return null;
}

function isSafePath(path: string) {
  if (path.length > 320) return false;
  const parts = path.split('/');
  return parts.length >= 3 && parts.every(part =>
    part.length > 0 &&
    part !== '.' &&
    part !== '..' &&
    !part.includes('\\') &&
    SAFE_FILE_RE.test(part)
  );
}

function getUploadScope(path: string): UploadScope | null {
  const parts = path.split('/');
  const [scope] = parts;

  if (scope === 'profiles') return 'profile_avatar';
  if (scope === 'chronicles') return 'chronicle_cover';
  if (scope !== 'pets') return null;

  const [, , , kind] = parts;
  if (kind === 'timeline') return 'pet_timeline';
  return 'pet_avatar';
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const path = form.get('path') as string | null;

  if (!file || !path) {
    return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  const authError = await authorizePath(userId, path);
  if (authError) return authError;

  const uploadScope = getUploadScope(path);
  if (!uploadScope) {
    return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 });
  }

  try {
    await assertUploadAllowed(userId, file.size);
  } catch (err) {
    if (err instanceof UploadLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }

    log.error('[upload:quota]', err);
    return NextResponse.json({ error: 'Upload quota validation failed' }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getStorageClient();

    await client.send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: path,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000',
      }),
    );

    try {
      await recordUploadEvent({
        userId,
        scope: uploadScope,
        objectKey: path,
        bytes: file.size,
      });
    } catch (err) {
      await deletePublicObject(getPublicUrl(path));
      throw err;
    }

    return NextResponse.json({ url: getPublicUrl(path) });
  } catch (err) {
    log.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { url } = await req.json().catch(() => ({ url: null }));
  if (typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  const parsed = parsePublicUrl(url);
  if (!parsed || parsed.bucket !== getBucketName()) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const authError = await authorizePath(userId, parsed.key);
  if (authError) return authError;

  const result = await deletePublicObject(url);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
