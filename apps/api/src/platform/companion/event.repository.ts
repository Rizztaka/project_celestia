import type { EventProgress } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export class EventRepository {
  /**
   * Returns all EventProgress rows for the given user.
   * The service filters these against the current static events.json.
   */
  async findAllByUserId(userId: string): Promise<EventProgress[]> {
    return prisma.eventProgress.findMany({ where: { userId } });
  }

  /**
   * Upserts the `claimed` state for a single (userId, eventKey, tierId) combination.
   * Idempotent: calling twice with the same value is safe.
   */
  async upsertTier(
    userId: string,
    eventKey: string,
    tierId: string,
    claimed: boolean,
  ): Promise<EventProgress> {
    return prisma.eventProgress.upsert({
      where: { userId_eventKey_tierId: { userId, eventKey, tierId } },
      create: { userId, eventKey, tierId, claimed },
      update: { claimed },
    });
  }
}
