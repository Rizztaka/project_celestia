import { readFile } from 'node:fs/promises';
import { parentPort, workerData } from 'node:worker_threads';
import { gunzipSync } from 'node:zlib';

await import(new URL('../../../web/public/vendor/gcsim-v2.47.2/wasm_exec.js', import.meta.url));
const go = new globalThis.Go();
const bytes = gunzipSync(
  await readFile(
    new URL('../../../web/public/vendor/gcsim-v2.47.2/engine.wasm.gz', import.meta.url),
  ),
);
const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
void go.run(instance);
const results = workerData.map(({ config, seed }) =>
  JSON.parse(globalThis.runCelestia(config, String(seed))),
);
parentPort.postMessage(results);
process.exit(0);
