import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';

const require = createRequire(import.meta.url);

const CHARACTER_WEAPON_TYPES = require('../../static/character-weapon-types.json') as Record<
  string,
  string
>;

export type SimulationStatus = 'VERIFIED_SIMULATION' | 'SCREENED' | 'HEURISTIC_FALLBACK';

export interface MemberActionDiagnostics {
  key: string;
  damage: number;
  dps: number;
  actions: number;
  waits: number;
  actionCounts?: Record<string, number> | null;
  blockedAttempts?: Record<string, number> | null;
}

export interface TeamSimulationResult {
  simulatedDps: number;
  errorMargin: number;
  simulationStatus: SimulationStatus;
  samples: number;
  members: MemberActionDiagnostics[];
  executionTimeMs?: number;
  fallbackReason?: string;
}

export interface SimulateTeamOptions {
  duration?: number;
  enemyLevel?: number;
  resistance?: number;
  samples?: number;
  timeoutMs?: number;
  seed?: number;
}

export interface SimulationMemberInput {
  characterKey: string;
  level?: number;
  constellation?: number;
  talentNormal?: number;
  talentSkill?: number;
  talentBurst?: number;
  equippedWeapon?: { weaponKey: string; level?: number; refinement?: number } | null;
}

export type CandidateMemberInput = string | SimulationMemberInput;

const STARTER_WEAPONS: Record<string, string> = {
  Sword: 'dullblade',
  Claymore: 'wastergreatsword',
  Polearm: 'beginnersprotector',
  Catalyst: 'apprenticesnotes',
  Bow: 'huntersbow',
};

const GCSIM_ALIASES: Record<string, string> = {
  raiden: 'raidenshogun',
  raidenshogun: 'raidenshogun',
  kokomi: 'sangonomiyakokomi',
  sangonomiyakokomi: 'sangonomiyakokomi',
  kazuha: 'kaedeharakazuha',
  kaedeharakazuha: 'kaedeharakazuha',
  ayaka: 'kamisatoayaka',
  kamisatoayaka: 'kamisatoayaka',
  ayato: 'kamisatoayato',
  kamisatoayato: 'kamisatoayato',
  heizou: 'shikanoinheizou',
  shikanoinheizou: 'shikanoinheizou',
  sara: 'kujousara',
  kujousara: 'kujousara',
  shinobu: 'kukishinobu',
  kukishinobu: 'kukishinobu',
  itto: 'aratakiitto',
  aratakiitto: 'aratakiitto',
  yae: 'yaemiko',
  yaemiko: 'yaemiko',
  traveler: 'aetheranemo',
  aether: 'aetheranemo',
  lumine: 'aetheranemo',
};

export function normalizeToGcsimKey(rawKey: string): string {
  const clean = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  return GCSIM_ALIASES[clean] ?? clean;
}

export class TeamSimulationService {
  private readonly runnerUrl: URL;

  constructor(runnerUrl?: URL) {
    this.runnerUrl =
      runnerUrl ?? new URL('../../../../../tooling/gcsim/runtime-runner.mjs', import.meta.url);
  }

  /**
   * Generates a deterministic gcsim configuration string for a 4-member party.
   */
  public generateConfig(
    members: CandidateMemberInput[],
    options?: SimulateTeamOptions,
  ): { config: string; resolvedKeys: string[] } {
    const duration = options?.duration ?? 45;
    const enemyLevel = options?.enemyLevel ?? 100;
    const resistance = (options?.resistance ?? 10) / 100;

    const charLines: string[] = [];
    const weaponLines: string[] = [];
    const resolvedKeys: string[] = [];

    for (const item of members) {
      const parsed: SimulationMemberInput =
        typeof item === 'string'
          ? {
              characterKey: item,
              level: 90,
              constellation: 0,
              talentNormal: 8,
              talentSkill: 8,
              talentBurst: 8,
            }
          : {
              characterKey: item.characterKey,
              level: item.level ?? 90,
              constellation: item.constellation ?? 0,
              talentNormal: item.talentNormal ?? 8,
              talentSkill: item.talentSkill ?? 8,
              talentBurst: item.talentBurst ?? 8,
              equippedWeapon: item.equippedWeapon,
            };

      const gcsimKey = normalizeToGcsimKey(parsed.characterKey);
      resolvedKeys.push(gcsimKey);

      const weaponType = CHARACTER_WEAPON_TYPES[parsed.characterKey] ?? 'Sword';
      const starterWeapon = STARTER_WEAPONS[weaponType] ?? 'dullblade';

      charLines.push(
        `${gcsimKey} char lvl=${parsed.level}/90 cons=${parsed.constellation} talent=${parsed.talentNormal},${parsed.talentSkill},${parsed.talentBurst};`,
      );
      weaponLines.push(`${gcsimKey} add weapon="${starterWeapon}" refine=1 lvl=90/90;`);
    }

    const firstChar = resolvedKeys[0]!;
    const rotationLines = resolvedKeys
      .map((k) => `  ${k} skill;\n  ${k} burst;\n  ${k} attack;`)
      .join('\n');

    const config = [
      `options iteration=1 duration=${duration} swap_delay=12;`,
      ...charLines,
      ...weaponLines,
      `target lvl=${enemyLevel} resist=${resistance} pos=0,0 radius=1;`,
      `active ${firstChar};`,
      'while 1 {',
      rotationLines,
      '  wait(1);',
      '}',
    ].join('\n');

    return { config, resolvedKeys };
  }

  /**
   * Runs the gcsim WASM engine in a dedicated Node worker thread with timeout isolation.
   */
  private runWorker(
    workerData: Array<{ config: string; seed: number }>,
    timeoutMs: number,
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.runnerUrl, {
        workerData,
      });

      const timer = setTimeout(() => {
        void worker.terminate();
        reject(new Error(`GCSim simulation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      worker.once('message', (result) => {
        clearTimeout(timer);
        resolve(result);
      });

      worker.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      worker.once('exit', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(`GCSim worker thread exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Simulates damage output and action timing for a 4-member party.
   * Gracefully degrades with 'HEURISTIC_FALLBACK' on any error without throwing.
   */
  public async simulateTeam(
    members: CandidateMemberInput[],
    options?: SimulateTeamOptions,
  ): Promise<TeamSimulationResult> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs ?? 20000;
    const samples = Math.max(1, options?.samples ?? 1);
    const baseSeed = options?.seed ?? 1;

    if (!members || members.length !== 4) {
      return {
        simulatedDps: 0,
        errorMargin: 0,
        simulationStatus: 'HEURISTIC_FALLBACK',
        samples: 0,
        members: [],
        executionTimeMs: Date.now() - startTime,
        fallbackReason: 'A team must have exactly 4 characters for simulation.',
      };
    }

    try {
      const { config } = this.generateConfig(members, options);

      const workerData = Array.from({ length: samples }, (_, i) => ({
        config,
        seed: baseSeed + i,
      }));

      const rawRuns = await this.runWorker(workerData, timeoutMs);

      if (!Array.isArray(rawRuns) || rawRuns.length === 0) {
        return {
          simulatedDps: 0,
          errorMargin: 0,
          simulationStatus: 'HEURISTIC_FALLBACK',
          samples: 0,
          members: [],
          executionTimeMs: Date.now() - startTime,
          fallbackReason: 'Simulation returned empty results.',
        };
      }

      for (const run of rawRuns) {
        if (run && typeof run === 'object' && 'error' in run && run.error) {
          return {
            simulatedDps: 0,
            errorMargin: 0,
            simulationStatus: 'HEURISTIC_FALLBACK',
            samples: 0,
            members: [],
            executionTimeMs: Date.now() - startTime,
            fallbackReason: String(run.error),
          };
        }
      }

      const count = rawRuns.length;
      const dpsValues = rawRuns.map((r: any) => (typeof r.dps === 'number' ? r.dps : 0));
      const meanDps = dpsValues.reduce((sum: number, v: number) => sum + v, 0) / count;

      const variance =
        count > 1
          ? dpsValues.reduce((sum: number, v: number) => sum + Math.pow(v - meanDps, 2), 0) /
            (count - 1)
          : 0;
      const stdDev = Math.sqrt(variance);
      const standardError = count > 1 ? stdDev / Math.sqrt(count) : 0;
      const errorMargin = count > 1 ? 1.96 * standardError : 0;

      const firstRun = rawRuns[0];
      const memberDiagnostics: MemberActionDiagnostics[] = (firstRun.members ?? []).map(
        (m: any) => ({
          key: m.key ?? '',
          damage: m.damage ?? 0,
          dps: (m.damage ?? 0) / ((firstRun.durationFrames ?? 1200) / 60),
          actions: m.actions ?? 0,
          waits: m.failedIntervals ?? 0,
          actionCounts: m.actionCounts ?? null,
          blockedAttempts: m.blockedAttempts ?? null,
        }),
      );

      return {
        simulatedDps: meanDps,
        errorMargin,
        simulationStatus: 'VERIFIED_SIMULATION',
        samples: count,
        members: memberDiagnostics,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        simulatedDps: 0,
        errorMargin: 0,
        simulationStatus: 'HEURISTIC_FALLBACK',
        samples: 0,
        members: [],
        executionTimeMs: Date.now() - startTime,
        fallbackReason: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
