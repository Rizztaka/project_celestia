import type { Request, Response } from 'express';
import { successResponse } from '@/core/utils/response.js';
import { EventService } from './event.service.js';

export class EventController {
  private readonly eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  /**
   * GET /api/v1/companion/events
   * Returns all non-expired events merged with the user's claim progress.
   */
  getEvents = async (req: Request, res: Response) => {
    const data = await this.eventService.getEvents(req.user!.id);
    res.status(200).json(successResponse(data, 'Events fetched.'));
  };

  /**
   * PATCH /api/v1/companion/events/:eventKey/tiers/:tierId
   * Upserts the claimed state for a single reward tier.
   */
  patchTier = async (req: Request, res: Response) => {
    const { eventKey, tierId } = req.params as { eventKey: string; tierId: string };
    const result = await this.eventService.patchTier(req.user!.id, eventKey, tierId, req.body);
    res.status(200).json(successResponse(result, 'Reward tier updated.'));
  };
}
