import type { Feature } from '@/lib/plans';
import { canUse, getEffectivePlanServer } from '@/lib/plans';
import { prisma } from '@/lib/prisma';

export class AccessDeniedError extends Error {
  constructor(
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'UPGRADE_REQUIRED',
    message: string,
  ) {
    super(message);
  }
}

export async function assertFeatureAccess(userId: string, feature: Feature) {
  const planId = await getEffectivePlanServer(userId);
  if (!canUse(planId, feature)) {
    throw new AccessDeniedError('UPGRADE_REQUIRED', 'Upgrade required');
  }
  return planId;
}

export async function assertOwnsPet(userId: string, petId: string | undefined) {
  if (!petId) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      owner_id: true,
      collaborators: {
        where: { profile_id: userId, role: 'editor' },
        select: { id: true },
      },
    },
  });

  if (!pet) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }

  const isOwner = pet.owner_id === userId;
  const isEditor = pet.collaborators.length > 0;
  if (!isOwner && !isEditor) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }
}

export async function assertPetOwnerOnly(userId: string, petId: string | undefined) {
  if (!petId) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { owner_id: true },
  });
  if (pet?.owner_id !== userId) {
    throw new AccessDeniedError('FORBIDDEN', 'Forbidden');
  }
}
