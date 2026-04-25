import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardAlerts } from '@/lib/dashboard/alerts';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = await getDashboardAlerts(supabase, user.id);
  return NextResponse.json(alerts);
}
