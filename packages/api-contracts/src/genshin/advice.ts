/** C2b advice is separate from stored goals and imported observations. */
export interface AdviceGoalInput {
  id: string;
  targetKey: string;
  goalType: string;
  fromPhase: number;
  toPhase: number;
  talentType: string | null;
}

export interface AdviceSource {
  authority: 'primary' | 'owner' | 'community';
  reference: string;
  localEvidence: string;
  verifier: string;
  reviewedOn: string;
  observedOn: string | null;
  gameVersion: string | null;
}

export interface AdviceAvailability {
  goalId: string;
  targetKey: string;
  available: boolean;
  reason: string | null;
}

export interface AdviceDomain {
  domainKey: string;
  name: string;
  location: string;
  days: number[];
  drops: string[];
  dropKeys: string[];
  resinPerClaim: number;
}

export type RouteAdvice =
  { available: true; domain: AdviceDomain } | { available: false; reason: string };

export type GoalAdvice =
  | {
      available: true;
      costs: Record<string, number>;
      sources: AdviceSource[];
      route: RouteAdvice;
      routes?: AdviceDomain[];
      /** Craftable families, in ascending tier order; three lower items make one higher item. */
      conversionGroups?: string[][];
    }
  | { available: false; reason: string };

export interface MaterialAdviceResponse {
  contractVersion: 2;
  needed: Record<string, number>;
  inventory: Record<string, number>;
  /** null means absent stock evidence, including after an empty replacement import. */
  delta: Record<string, number | null>;
  /** Goal-first estimate: credits recorded stock/crafting; unrecorded stock contributes nothing. */
  planningDelta?: Record<string, number>;
  goals: AdviceAvailability[];
  neededComplete: boolean;
  sources: AdviceSource[];
  stockBasis: {
    kind: 'recorded_import';
    importedAt: string | null;
    source: string | null;
    scope: string | null;
    suppliedEntryCount: number | null;
  };
}

export type RecordedStockSnapshot = Pick<MaterialAdviceResponse, 'inventory' | 'stockBasis'>;
