// Execute the shipped browser worker unchanged in Node, with same-origin asset reads.
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';
import { parentPort, workerData } from 'node:worker_threads';

const publicRoot = new URL('../../../web/public/', import.meta.url);
globalThis.self = globalThis;
globalThis.importScripts = (path) => {
  if (path !== '/vendor/gcsim-v2.47.2/wasm_exec.js') throw new Error('Unexpected script');
  runInThisContext(readFileSync(new URL(path.slice(1), publicRoot), 'utf8'));
};
globalThis.fetch = async (path) => {
  if (!path.startsWith('/vendor/gcsim-v2.47.2/engine.wasm.gz?v='))
    throw new Error('Unexpected fetch');
  return new Response(readFileSync(new URL('vendor/gcsim-v2.47.2/engine.wasm.gz', publicRoot)));
};
const results = [];
globalThis.postMessage = (message) => {
  if (message.type === 'result' || message.type === 'error') results.push(message);
};
runInThisContext(readFileSync(new URL('team-simulation-worker.js', publicRoot), 'utf8'));
for (const data of workerData) await globalThis.onmessage({ data });
parentPort.postMessage(results);
process.exit(0);
