import type { EventsFileData, StaticEvent, StaticRewardTier } from '@/core/contracts/companion.interfaces.js';
import { BadRequestError, NotFoundError } from '@/core/errors/app-error.js';

import { companionRegistry } from './companion-registry.service.js';
import { EventRepository } from './event.repository.js';

// -------------------------------------------------------
// Public response types
// -------------------------------------------------------

export interface HydratedRewardTier {
  tierId: string;
  label: string;
  primogems: number;
  other: string[];
  claimed: boolean;
}

export interface HydratedEvent {
  key: string;
  name: string;
  type: string;
  startUtc: string;
  endUtc: string;
  isActive: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
  hoursRemaining: number;
  description: string;
  wikiUrl: string | null;
  rewardTiers: HydratedRewardTier[];
  claimedPrimogems: number;
  totalPrimogems: number;
}

export interface EventsResponse {
  patch: string;
  totalUnclaimedPrimogems: number;
  events: HydratedEvent[];
}

export interface TierUpdateResult {
  eventKey: string;
  tierId: string;
  claimed: boolean;
}

// -------------------------------------------------------
// Input validation
// -------------------------------------------------------

import { z } from 'zod';

const PatchTierSchema = z.object({
  claimed: z.boolean(),
});

// -------------------------------------------------------
// EventService
// -------------------------------------------------------

export class EventService {
  private readonly repository: EventRepository;

  constructor() {
    this.repository = new EventRepository();
  }

  /**
   * Returns all non-expired events from events.json, merged with the user's
   * progress rows. Expired events are filtered out server-side.
   * Events are sorted: active (by endUtc ASC) → upcoming.
   * The root-level totalUnclaimedPrimogems is the sum of unclaimed Primogem
   * tiers across ALL active events.
   */
  async getEvents(userId: string, gameId: string = 'genshin'): Promise<EventsResponse> {
    const now = new Date();
    const eventsFile = companionRegistry.getProvider(gameId).getEventsData();

    // Load all user progress rows as a fast lookup map: "eventKey|tierId" → claimed
    const progressRows = await this.repository.findAllByUserId(userId);
    const claimedMap = new Map<string, boolean>();
    for (const row of progressRows) {
      claimedMap.set(`${row.eventKey}|${row.tierId}`, row.claimed);
    }

    // Hydrate each event — skip fully expired ones
    const hydratedEvents: HydratedEvent[] = [];

    for (const staticEvent of eventsFile.events) {
      const startDate = new Date(staticEvent.startUtc);
      const endDate = new Date(staticEvent.endUtc);

      // Filter out expired events (as per spec)
      if (endDate <= now) continue;

      const isUpcoming = startDate > now;
      const isActive = !isUpcoming;
      const msRemaining = endDate.getTime() - now.getTime();
      const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));

      // Merge tier claim state
      let claimedPrimogems = 0;
      let totalPrimogems = 0;

      const rewardTiers: HydratedRewardTier[] = staticEvent.rewardTiers.map((tier) => {
        const claimed = claimedMap.get(`${staticEvent.key}|${tier.tierId}`) ?? false;
        totalPrimogems += tier.primogems;
        if (claimed) claimedPrimogems += tier.primogems;
        return { ...tier, claimed };
      });

      hydratedEvents.push({
        key: staticEvent.key,
        name: staticEvent.name,
        type: staticEvent.type,
        startUtc: staticEvent.startUtc,
        endUtc: staticEvent.endUtc,
        isActive,
        isUpcoming,
        isExpired: false, // never true here — expired are filtered above
        hoursRemaining,
        description: staticEvent.description,
        wikiUrl: staticEvent.wikiUrl,
        rewardTiers,
        claimedPrimogems,
        totalPrimogems,
      });
    }

    // Sort: active events by urgency (soonest to expire first), then upcoming
    hydratedEvents.sort((a, b) => {
      if (a.isActive && b.isActive) {
        return new Date(a.endUtc).getTime() - new Date(b.endUtc).getTime();
      }
      if (a.isActive) return -1;
      if (b.isActive) return 1;
      // Both upcoming: sort by start date
      return new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime();
    });

    // Total unclaimed primogems across all active events only
    const totalUnclaimedPrimogems = hydratedEvents
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + (e.totalPrimogems - e.claimedPrimogems), 0);

    return {
      patch: eventsFile.patch,
      totalUnclaimedPrimogems,
      events: hydratedEvents,
    };
  }

  /**
   * Upserts the claimed state for a single reward tier.
   * Validates that eventKey and tierId exist in events.json.
   * Returns 404 if either is unknown, 400 if the request body is malformed.
   */
  async patchTier(
    userId: string,
    eventKey: string,
    tierId: string,
    rawBody: unknown,
    gameId: string = 'genshin',
  ): Promise<TierUpdateResult> {
    // Validate request body
    const result = PatchTierSchema.safeParse(rawBody);
    if (!result.success) {
      throw new BadRequestError(
        result.error.errors[0]?.message ?? 'Invalid request body. Expected { claimed: boolean }.',
      );
    }

    const eventsFile = companionRegistry.getProvider(gameId).getEventsData();

    // Validate eventKey exists in the static file
    const staticEvent = eventsFile.events.find((e) => e.key === eventKey);
    if (!staticEvent) {
      throw new NotFoundError(`Event "${eventKey}" was not found in the current patch data.`);
    }

    // Validate tierId exists within that event
    const staticTier = staticEvent.rewardTiers.find((t) => t.tierId === tierId);
    if (!staticTier) {
      throw new NotFoundError(
        `Reward tier "${tierId}" does not exist for event "${staticEvent.name}".`,
      );
    }

    const { claimed } = result.data;
    const row = await this.repository.upsertTier(userId, eventKey, tierId, claimed);

    return { eventKey: row.eventKey, tierId: row.tierId, claimed: row.claimed };
  }
}
