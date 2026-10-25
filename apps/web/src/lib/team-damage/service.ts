import manifest from '../../../public/vendor/gcsim-v2.47.2/manifest.json';
import { type EngineRun, summarizeRuns } from './calculator';

export type DamageResult = ReturnType<typeof summarizeRuns>;
export function runTeamSimulation(
  config: string,
  samples: number,
  progress: (message: string) => void,
) {
  const worker = new Worker(`/team-simulation-worker.js?v=${manifest.wasmSha256}`);
  let settled = false;
  let rejectRun: (reason: Error) => void = () => {};
  const promise = new Promise<DamageResult>((resolve, reject) => {
    rejectRun = reject;
    worker.onmessage = ({ data }) => {
      if (settled) return;
      if (data.type === 'loading') progress('Loading simulator…');
      if (data.type === 'progress')
        progress(`Simulating ${data.completed} of ${data.total} samples…`);
      if (data.type === 'error') {
        settled = true;
        reject(new Error(data.message));
      }
      if (data.type === 'result') {
        try {
          const result = summarizeRuns(data.runs as EngineRun[]);
          settled = true;
          resolve(result);
        } catch {
          settled = true;
          reject(new Error('The simulator returned an invalid result.'));
        }
      }
    };
    worker.onerror = () => {
      settled = true;
      reject(new Error('The browser could not run the simulator. Try again or use fewer samples.'));
    };
    worker.postMessage({ config, samples, hash: manifest.wasmSha256 });
  });
  const timeout = window.setTimeout(() => {
    if (!settled) {
      settled = true;
      worker.terminate();
      rejectRun(new Error('The simulation timed out. Shorten the rotation or reduce samples.'));
    }
  }, 120000);
  return {
    promise: promise.finally(() => {
      window.clearTimeout(timeout);
      worker.terminate();
    }),
    cancel: () => {
      if (!settled) {
        settled = true;
        worker.terminate();
        rejectRun(new Error('Simulation cancelled.'));
      }
    },
  };
}
