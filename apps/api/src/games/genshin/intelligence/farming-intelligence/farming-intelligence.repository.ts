import type { PlanAdvice, SupportedServerId } from '@celestia/api-contracts';

import { ConflictError } from '@/core/errors/app-error.js';

import { companionRegistry } from '../../../../platform/companion/companion-registry.service.js';
import { PlanService } from '../../../../platform/companion/plan.service.js';

export interface FarmingContext {
  advice: PlanAdvice;
  serverId: SupportedServerId | null;
  weekday: number | null;
  validUntil?: string | null;
}
export class FarmingIntelligenceRepository {
  async read(userId: string): Promise<FarmingContext> {
    const provider = companionRegistry.getProvider('genshin');
    const plans = new PlanService(provider);
    for (let attempt = 0; attempt < 2; attempt++) {
      const snapshot = await plans.getSnapshot(userId);
      const advice = await plans.getAdvice(userId);
      if (
        snapshot.revision !== advice.revision ||
        snapshot.routineRevision !== advice.routineRevision ||
        JSON.stringify(snapshot.goalRevisions) !== JSON.stringify(advice.goalRevisions) ||
        (snapshot.period?.dailyPeriodId ?? null) !== advice.dailyPeriodId
      )
        continue;
      return {
        advice,
        serverId: snapshot.serverId,
        weekday: provider.getServerWeekday(snapshot.serverId, new Date(advice.serverNow)),
        validUntil: snapshot.period?.dailyEnd ?? null,
      };
    }
    throw new ConflictError('Your plan changed. Refresh before comparing farming estimates.');
  }
}
