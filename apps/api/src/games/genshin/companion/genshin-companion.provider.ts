import { createRequire } from 'module';

import type { EventsFileData, ICompanionProvider, WeeklyBossesFileData } from '@/core/contracts/companion.interfaces.js';

const require = createRequire(import.meta.url);

const eventsFile: EventsFileData = require('../static/events.json');
const weeklyBossesFile: WeeklyBossesFileData = require('../static/weekly-bosses.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const characterMaterials: Record<string, any> = require('../static/character-materials.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const weaponMaterials: Record<string, any> = require('../static/weapon-materials.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const domainSchedule: any = require('../static/domain-schedule.json');

export class GenshinCompanionProvider implements ICompanionProvider {
  readonly gameId = 'genshin';

  getEventsData(): EventsFileData {
    return eventsFile;
  }

  getWeeklyBossesData(): WeeklyBossesFileData {
    return weeklyBossesFile;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCharacterMaterials(): Record<string, any> {
    return characterMaterials;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getWeaponMaterials(): Record<string, any> {
    return weaponMaterials;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDomainSchedule(): any {
    return domainSchedule;
  }
}
