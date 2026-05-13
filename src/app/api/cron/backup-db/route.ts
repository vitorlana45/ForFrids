import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getBucketName, getStorageClient } from '@/lib/storage/client';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function pgDumpToBuffer(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      reject(new Error('DATABASE_URL não configurado'));
      return;
    }

    const proc = spawn('pg_dump', [
      '--no-owner',
      '--no-privileges',
      '--clean',
      '--if-exists',
      '--format=plain',
      databaseUrl,
    ]);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    proc.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    proc.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
      } else {
        reject(new Error(`pg_dump exit ${code}: ${Buffer.concat(stderrChunks).toString()}`));
      }
    });
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dump = await pgDumpToBuffer();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/postgres/${stamp}.sql`;

    const client = getStorageClient();
    await client.send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: dump,
        ContentType: 'application/sql',
        CacheControl: 'private, no-store',
      }),
    );

    log.info('[backup:db] sucesso', { key, bytes: dump.length });
    return NextResponse.json({ ok: true, key, bytes: dump.length });
  } catch (error) {
    log.error('[backup:db] falha', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'backup error' },
      { status: 500 },
    );
  }
}
