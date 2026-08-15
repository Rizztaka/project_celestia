export interface StaticRewardTier {
  tierId: string;
  label: string;
  primogems: number;
  other: string[];
}

export interface StaticEvent {
  key: string;
  name: string;
  type: string;
  startUtc: string;
  endUtc: string;
  description: string;
  wikiUrl: string | null;
  rewardTiers: StaticRewardTier[];
}

export interface EventsFileData {
  patch: string;
  patchStartUtc: string;
  patchEndUtc: string;
  events: StaticEvent[];
}

export interface StaticWeeklyBoss {
  key: string;
  name: string;
  location: string;
  domainName: string;
  dropKeys: string[];
  wikiUrl: string | null;
}

export interface WeeklyBossesFileData {
  bosses: StaticWeeklyBoss[];
}

export interface ICompanionProvider {
  /** Uniquely identifies the game this provider serves (e.g. 'genshin', 'hsr') */
  readonly gameId: string;

  getEventsData(): EventsFileData;
  getWeeklyBossesData(): WeeklyBossesFileData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCharacterMaterials(): Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getWeaponMaterials(): Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDomainSchedule(): any;
}
