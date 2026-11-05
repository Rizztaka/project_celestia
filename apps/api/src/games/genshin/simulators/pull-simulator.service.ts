import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

import {
  WISH_SANDBOX_RULES_VERSION,
  type WishBanner,
  type WishRequest,
  wishRequestSchema,
  type WishResult,
  type WishSandboxCatalog,
  wishSandboxCatalogSchema,
  wishSandboxRequestSchema,
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
  getSandboxCatalog(): WishSandboxCatalog {
    return wishSandboxCatalogSchema.parse({
      contractVersion: 1,
      rulesVersion: WISH_SANDBOX_RULES_VERSION,
      banners,
      notices: [
        'Historical fictional scenarios, not the live wish schedule or an account-value recommendation.',
        'Soft pity is approximate. Character scenarios use a simplified 50/50 and omit Capturing Radiance.',
        'The Chronicled scenario offers character path targets only. This is not a complete current-version wish model.',
        'Fictional results do not change your account, real wish history or savings.',
      ],
    });
  }
  simulateSandbox(request: unknown): WishResult {
    const parsed = wishSandboxRequestSchema.safeParse(request);
    if (!parsed.success) throw new UnprocessableError('Invalid sandbox request.');
    const { rulesVersion, ...input } = parsed.data;
    if (rulesVersion !== WISH_SANDBOX_RULES_VERSION)
      throw new UnprocessableError('Sandbox rules changed. Reload the catalog before continuing.');
    return this.simulateParsedPulls(input);
  }
  simulatePulls(request: WishRequest): WishResult {
    const parsed = wishRequestSchema.safeParse(request);
    if (!parsed.success)
      throw new UnprocessableError(parsed.error.errors.map((e) => e.message).join('; '));
    return this.simulateParsedPulls(parsed.data);
  }
  private simulateParsedPulls(input: WishRequest): WishResult {
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
