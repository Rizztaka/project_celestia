import manifest from '../../../public/vendor/gcsim-v2.47.2/manifest.json';
import { type EngineRun, summarizeRuns } from './calculator';
import { rankDamage } from './rotation-search.calculator';

export type DamageResult = ReturnType<typeof summarizeRuns>;
export interface SimulationJob {
  id: string;
  config: string;
  samples: number;
}
type JobResult = { id: string; result: DamageResult | null; error?: string };

function simulationSession(progress: (message: string) => void) {
  const worker = new Worker(`/team-simulation-worker.js?v=${manifest.wasmSha256}-batch2`);
  let rejectPending: ((reason: Error) => void) | null = null;
  let closed = false;
  function close(message?: string) {
    closed = true;
    worker.terminate();
    window.clearTimeout(timeout);
    rejectPending?.(new Error(message ?? 'Simulation cancelled.'));
    rejectPending = null;
  }
  const timeout = window.setTimeout(
    () => close('The simulation timed out. Try a smaller search or shorter duration.'),
    240000,
  );
  return {
    close,
    run(jobs: SimulationJob[], phase: string) {
      return new Promise<JobResult[]>((resolve, reject) => {
        if (closed) {
          reject(new Error('Simulation cancelled.'));
          return;
        }
        rejectPending = reject;
        worker.onmessage = ({ data }) => {
          if (closed) return;
          if (data.type === 'loading') progress(`${phase}: loading simulator…`);
          if (data.type === 'progress')
            progress(`${phase}: ${data.completed} of ${data.total} samples…`);
          if (data.type === 'error') {
            rejectPending = null;
            reject(new Error(data.message));
          }
          if (data.type === 'result') {
            try {
              if (!Array.isArray(data.results) || data.results.length !== jobs.length)
                throw new Error('The simulator returned an incomplete comparison.');
              const rows = jobs.map((job) => {
                const matches = data.results.filter((row: { id: string }) => row.id === job.id);
                if (matches.length !== 1)
                  throw new Error('The simulator returned an invalid comparison.');
                const row = matches[0] as { error?: string; runs: EngineRun[] };
                if (row.error) return { id: job.id, result: null, error: row.error };
                if (row.runs.length !== job.samples)
                  throw new Error('A simulation sample is missing.');
                return { id: job.id, result: summarizeRuns(row.runs) };
              });
              rejectPending = null;
              resolve(rows);
            } catch (error) {
              rejectPending = null;
              reject(error instanceof Error ? error : new Error('Invalid simulation result.'));
            }
          }
        };
        worker.onerror = () => {
          rejectPending = null;
          reject(new Error('The browser could not run the simulator.'));
        };
        worker.postMessage({ jobs, hash: manifest.wasmSha256 });
      });
    },
  };
}

export function runTeamSimulation(
  config: string,
  samples: number,
  progress: (message: string) => void,
) {
  const session = simulationSession(progress);
  const promise = session
    .run([{ id: '0', config, samples }], 'Simulation')
    .then((rows) => {
      if (!rows[0].result) throw new Error(rows[0].error ?? 'Simulation failed.');
      return rows[0].result;
    })
    .finally(() => session.close());
  return { promise, cancel: () => session.close() };
}

export interface SearchResult {
  tested: number;
  failed: number;
  samples: number;
  ranked: { id: string; result: DamageResult }[];
}
/** Screen with seed 1; re-evaluate the top three and baseline using identical seeds 1..N. */
export function searchTeamRotations(
  candidates: { id: string; config: string }[],
  samples: number,
  progress: (message: string) => void,
) {
  const session = simulationSession(progress);
  const promise: Promise<SearchResult> = (async () => {
    const screened = await session.run(
      candidates.map((c) => ({ ...c, samples: 1 })),
      'Finding promising rotations',
    );
    const baseline = screened.find((row) => row.id === '0');
    if (!baseline?.result)
      throw new Error(baseline?.error ?? 'Your current rotation could not be simulated.');
    const valid = screened.flatMap((row) =>
      row.result ? [{ id: row.id, dps: row.result.dps }] : [],
    );
    const finalistIds = [
      ...new Set([
        '0',
        ...rankDamage(valid)
          .slice(0, 3)
          .map((row) => row.id),
      ]),
    ];
    const finalists = await session.run(
      finalistIds.map((id) => ({ ...candidates.find((c) => c.id === id)!, samples })),
      'Verifying finalists against your rotation',
    );
    if (!finalists.find((row) => row.id === '0')?.result)
      throw new Error('The baseline verification failed. No comparison can be shown.');
    const ranked = rankDamage(
      finalists.flatMap((row) =>
        row.result ? [{ id: row.id, dps: row.result.dps, result: row.result }] : [],
      ),
    );
    return {
      tested: candidates.length,
      failed:
        screened.filter((row) => !row.result).length +
        finalists.filter((row) => !row.result).length,
      samples,
      ranked,
    };
  })().finally(() => session.close());
  return { promise, cancel: () => session.close() };
}
