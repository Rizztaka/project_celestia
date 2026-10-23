import { logger } from '@/core/logger/logger.js';

import { HoyolabRepository } from './hoyolab.repository.js';
import { HoyolabService } from './hoyolab.service.js';
export function startHoyolabRefresh() {
  const service = new HoyolabService(),
    repository = new HoyolabRepository();
  let stopped = false,
    pending: Promise<void> | null = null;
  const tick = () => {
    if (stopped || pending || !service.available) return;
    pending = (async () => {
      for (const row of await repository.due(new Date())) {
        if (stopped) break;
        try {
          await service.sync(row.userId, true);
        } catch {
          logger.warn({ feature: 'hoyolab' }, 'Account refresh deferred.');
        }
      }
    })()
      .catch(() => logger.warn({ feature: 'hoyolab' }, 'Account refresh deferred.'))
      .finally(() => {
        pending = null;
      });
  };
  const timer = service.available ? setInterval(tick, 60_000) : null;
  timer?.unref();
  if (service.available) tick();
  return async () => {
    stopped = true;
    if (timer) clearInterval(timer);
    await pending;
  };
}
