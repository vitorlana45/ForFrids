import { createClient } from '@supabase/supabase-js';

function getAdminKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function assertValidAdminKey(key: string) {
  const looksLikeSecretKey = key.startsWith('sb_secret_');
  const looksLikeServiceRoleJwt = key.startsWith('eyJ');

  if (!looksLikeSecretKey && !looksLikeServiceRoleJwt) {
    throw new Error(
      'Invalid Supabase admin key. Use SUPABASE_SECRET_KEY=sb_secret_... or SUPABASE_SERVICE_ROLE_KEY=service_role JWT from Supabase Project Settings > API Keys.',
    );
  }
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = getAdminKey();

  if (!url || !adminKey) {
    throw new Error('Missing Supabase admin environment variables');
  }
  assertValidAdminKey(adminKey);

  return createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
