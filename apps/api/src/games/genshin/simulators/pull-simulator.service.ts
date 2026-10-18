import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

import {
  type WishBanner,
  type WishRequest,
  wishRequestSchema,
  type WishResult,
} from '@celestia/api-contracts';

import { UnprocessableError } from '@/core/errors/app-error.js';

import { calculateWishes } from './wish-rules.calculator.js';
const require = createRequire(import.meta.url);
const { banners } = require('../static/active-banners.json') as { banners: WishBanner[] };
export type {
  WishBanner as Banner,
  WishRequest as PullRequest,
  WishResultItem as PullResultItem,
  WishResult as PullSimulationResult,
} from '@celestia/api-contracts';
export class PullSimulatorService {
  constructor(private readonly random: () => number = Math.random) {}
  getBanners(): WishBanner[] {
    return banners;
  }
  simulatePulls(request: WishRequest): WishResult {
    const parsed = wishRequestSchema.safeParse(request);
    if (!parsed.success)
      throw new UnprocessableError(parsed.error.errors.map((e) => e.message).join('; '));
    const input = parsed.data;
    const banner = banners.find((b) => b.bannerId === input.bannerId);
    if (!banner) throw new UnprocessableError('Unknown simulator scenario.');
    if (input.currentPity5 >= banner.hardPity)
      throw new UnprocessableError('Pity must be below the banner hard pity.');
    if (banner.type === 'CHARACTER' && (input.pathTargetKey !== undefined || input.fatePoints))
      throw new UnprocessableError('Character wishes do not use Fate Points.');
    if (
      banner.fatePointCap &&
      (!input.pathTargetKey || !banner.fiveStarKeys.includes(input.pathTargetKey))
    )
      throw new UnprocessableError('Choose a valid path target from this scenario.');
    const result = calculateWishes(banner, input, this.random);
    return { ...result, pulls: result.pulls.map((item) => ({ ...item, id: randomUUID() })) };
  }
}
export const pullSimulatorService = new PullSimulatorService();
