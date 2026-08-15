import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventService } from './event.service.js';
import { BadRequestError, NotFoundError } from '@/core/errors/app-error.js';

// -------------------------------------------------------
// Mock repository
// -------------------------------------------------------

const mockFindAllByUserId = vi.fn();
const mockUpsertTier = vi.fn();

vi.mock('./event.repository.js', () => ({
  EventRepository: vi.fn().mockImplementation(() => ({
    findAllByUserId: mockFindAllByUserId,
    upsertTier: mockUpsertTier,
  })),
}));

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventService();
  });

  // ─────────────────────────────────────────────────────
  // getEvents
  // ─────────────────────────────────────────────────────

  describe('getEvents', () => {
    it('returns events with claimed=false when the user has no progress rows', async () => {
      mockFindAllByUserId.mockResolvedValue([]);

      const result = await service.getEvents('user-1');

      expect(result.events.length).toBeGreaterThan(0);
      // All tiers should default to claimed: false
      for (const event of result.events) {
        for (const tier of event.rewardTiers) {
          expect(tier.claimed).toBe(false);
        }
      }
    });

    it('correctly merges a claimed progress row into the response', async () => {
      // Simulate user having claimed tier t1 on the first event
      mockFindAllByUserId.mockResolvedValue([
        {
          userId: 'user-1',
          eventKey: 'EchoesOfTheDeep5.8',
          tierId: 't1',
          claimed: true,
        },
      ]);

      const result = await service.getEvents('user-1');
      const event = result.events.find((e) => e.key === 'EchoesOfTheDeep5.8');

      expect(event).toBeDefined();
      const t1 = event!.rewardTiers.find((t) => t.tierId === 't1');
      const t2 = event!.rewardTiers.find((t) => t.tierId === 't2');
      expect(t1!.claimed).toBe(true);
      expect(t2!.claimed).toBe(false);
    });

    it('correctly computes claimedPrimogems and totalPrimogems per event', async () => {
      // Claim t1 (60 gems) and t2 (60 gems) of EchoesOfTheDeep
      mockFindAllByUserId.mockResolvedValue([
        { userId: 'user-1', eventKey: 'EchoesOfTheDeep5.8', tierId: 't1', claimed: true },
        { userId: 'user-1', eventKey: 'EchoesOfTheDeep5.8', tierId: 't2', claimed: true },
      ]);

      const result = await service.getEvents('user-1');
      const event = result.events.find((e) => e.key === 'EchoesOfTheDeep5.8');

      expect(event!.claimedPrimogems).toBe(120);
      expect(event!.totalPrimogems).toBe(180);
    });

    it('computes totalUnclaimedPrimogems correctly across events', async () => {
      // Claim ALL tiers for EchoesOfTheDeep (180 gems), leave others untouched
      mockFindAllByUserId.mockResolvedValue([
        { userId: 'user-1', eventKey: 'EchoesOfTheDeep5.8', tierId: 't1', claimed: true },
        { userId: 'user-1', eventKey: 'EchoesOfTheDeep5.8', tierId: 't2', claimed: true },
        { userId: 'user-1', eventKey: 'EchoesOfTheDeep5.8', tierId: 't3', claimed: true },
      ]);

      const result = await service.getEvents('user-1');

      // EchoesOfTheDeep is fully claimed; other events still have unclaimed gems.
      // We don't know the exact count without reading events.json, but it must
      // be LESS than the total with nothing claimed.
      const allUnclaimedResult = await (async () => {
        mockFindAllByUserId.mockResolvedValueOnce([]);
        return service.getEvents('user-1');
      })();

      expect(result.totalUnclaimedPrimogems).toBeLessThan(
        allUnclaimedResult.totalUnclaimedPrimogems,
      );
    });

    it('sorts active events by end date ascending (most urgent first)', async () => {
      mockFindAllByUserId.mockResolvedValue([]);

      const result = await service.getEvents('user-1');
      const activeEvents = result.events.filter((e) => e.isActive);

      for (let i = 1; i < activeEvents.length; i++) {
        const prev = new Date(activeEvents[i - 1]!.endUtc).getTime();
        const curr = new Date(activeEvents[i]!.endUtc).getTime();
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('returns isExpired: false for all returned events (expired are filtered out)', async () => {
      mockFindAllByUserId.mockResolvedValue([]);

      const result = await service.getEvents('user-1');
      for (const event of result.events) {
        expect(event.isExpired).toBe(false);
      }
    });
  });

  // ─────────────────────────────────────────────────────
  // patchTier
  // ─────────────────────────────────────────────────────

  describe('patchTier', () => {
    it('throws BadRequestError when body is missing or malformed', async () => {
      await expect(service.patchTier('user-1', 'EchoesOfTheDeep5.8', 't1', {})).rejects.toThrow(
        BadRequestError,
      );

      await expect(
        service.patchTier('user-1', 'EchoesOfTheDeep5.8', 't1', { claimed: 'yes' }),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError for unknown eventKey', async () => {
      await expect(
        service.patchTier('user-1', 'NonExistentEvent', 't1', { claimed: true }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for valid eventKey but unknown tierId', async () => {
      await expect(
        service.patchTier('user-1', 'EchoesOfTheDeep5.8', 't99', { claimed: true }),
      ).rejects.toThrow(NotFoundError);
    });

    it('calls repository.upsertTier with correct arguments', async () => {
      mockUpsertTier.mockResolvedValue({
        eventKey: 'EchoesOfTheDeep5.8',
        tierId: 't1',
        claimed: true,
      });

      const result = await service.patchTier('user-1', 'EchoesOfTheDeep5.8', 't1', {
        claimed: true,
      });

      expect(mockUpsertTier).toHaveBeenCalledWith('user-1', 'EchoesOfTheDeep5.8', 't1', true);
      expect(result).toEqual({ eventKey: 'EchoesOfTheDeep5.8', tierId: 't1', claimed: true });
    });

    it('is idempotent — calling twice with the same value is safe', async () => {
      mockUpsertTier.mockResolvedValue({
        eventKey: 'EchoesOfTheDeep5.8',
        tierId: 't1',
        claimed: true,
      });

      await service.patchTier('user-1', 'EchoesOfTheDeep5.8', 't1', { claimed: true });
      await service.patchTier('user-1', 'EchoesOfTheDeep5.8', 't1', { claimed: true });

      expect(mockUpsertTier).toHaveBeenCalledTimes(2);
    });
  });
});
