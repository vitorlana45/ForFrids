import { NextResponse } from 'next/server';
import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getBucketName, getStorageClient } from '@/lib/storage/client';

export const dynamic = 'force-dynamic';

async function checkDb() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'db error',
    };
  }
}

async function checkStorage() {
  const started = Date.now();
  try {
    const client = getStorageClient();
    await client.send(new HeadBucketCommand({ Bucket: getBucketName() }));
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'storage error',
    };
  }
}

export async function GET() {
  const [db, storage] = await Promise.all([checkDb(), checkStorage()]);
  const ok = db.ok && storage.ok;
  const body = {
    status: ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    checks: { db, storage },
  };
  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
