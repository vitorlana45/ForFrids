import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { getDashboardAlerts } from '@/lib/dashboard/alerts';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await getDashboardAlerts(session.user.id);
  return NextResponse.json(alerts);
}
