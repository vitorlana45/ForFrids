import type { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardAlerts {
  pendingApprovalsCount: number;
  readyCapsulesCount: number;
  memorialLikesCount: number;
  total: number;
}

export async function getDashboardAlerts(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardAlerts> {
  const { data: petsData } = await supabase
    .from('pets')
    .select('id')
    .eq('owner_id', userId);

  const petIds = ((petsData as { id: string }[] | null) ?? []).map(pet => pet.id);

  if (petIds.length === 0) {
    return {
      pendingApprovalsCount: 0,
      readyCapsulesCount: 0,
      memorialLikesCount: 0,
      total: 0,
    };
  }

  const [{ count: approvalsCount }, { count: capsulesCount }, { count: likesCount }] = await Promise.all([
    supabase
      .from('tributes')
      .select('id', { count: 'exact', head: true })
      .in('pet_id', petIds)
      .eq('status', 'pending'),
    supabase
      .from('time_capsules')
      .select('id', { count: 'exact', head: true })
      .in('pet_id', petIds)
      .eq('opened', false)
      .lte('open_at', new Date().toISOString()),
    supabase
      .from('memorial_reactions')
      .select('id', { count: 'exact', head: true })
      .in('pet_id', petIds)
      .eq('reaction_type', 'heart'),
  ]);

  const pendingApprovalsCount = approvalsCount ?? 0;
  const readyCapsulesCount = capsulesCount ?? 0;
  const memorialLikesCount = likesCount ?? 0;

  return {
    pendingApprovalsCount,
    readyCapsulesCount,
    memorialLikesCount,
    total: pendingApprovalsCount + readyCapsulesCount,
  };
}
