/* global Go, importScripts, runCelestia */
// The worker has no account/network access beyond these same-origin engine assets.
// Combat is evaluated by the pinned MIT gcsim engine; Celestia supplies fixed seeds.
let boot;
let busy = false;
async function initialize(hash) {
  if (!boot)
    boot = (async () => {
      importScripts('/vendor/gcsim-v2.47.2/wasm_exec.js');
      if (typeof DecompressionStream !== 'function')
        throw new Error(
          'This browser cannot load the simulator. Use a current browser with decompression support.',
        );
      const response = await fetch(`/vendor/gcsim-v2.47.2/engine.wasm.gz?v=${hash}`);
      if (!response.ok) throw new Error('The simulator could not be downloaded.');
      let bytes = await response.arrayBuffer();
      if (new Uint8Array(bytes)[0] === 31 && new Uint8Array(bytes)[1] === 139) {
        bytes = await new Response(
          new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),
        ).arrayBuffer();
      }
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('');
      if (digest !== hash)
        throw new Error('Simulator integrity check failed. Reload the page and try again.');
      const go = new Go();
      const module = await WebAssembly.instantiate(bytes, go.importObject);
      void go.run(module.instance);
      if (typeof runCelestia !== 'function') throw new Error('The simulator did not initialize.');
    })();
  return boot;
}
self.onmessage = async ({ data }) => {
  if (busy) return;
  busy = true;
  try {
    // Keep already-open clients from the previous deployment working until refresh.
    const legacy = !data.jobs && typeof data.config === 'string';
    const jobs = legacy ? [{ id: '0', config: data.config, samples: data.samples }] : data.jobs;
    if (
      !Array.isArray(jobs) ||
      jobs.length < 1 ||
      jobs.length > 48 ||
      jobs.some(
        (job) =>
          typeof job.id !== 'string' ||
          job.id.length > 20 ||
          typeof job.config !== 'string' ||
          job.config.length > 40000 ||
          !Number.isInteger(job.samples) ||
          job.samples < 1 ||
          job.samples > 50,
      ) ||
      !/^[a-f0-9]{64}$/.test(data.hash)
    )
      throw new Error('Invalid simulation request.');
    self.postMessage({ type: 'loading' });
    await initialize(data.hash);
    const results = [];
    const total = jobs.reduce((sum, job) => sum + job.samples, 0);
    let completed = 0;
    for (const job of jobs) {
      const runs = [];
      try {
        for (let i = 0; i < job.samples; i++) {
          const result = JSON.parse(runCelestia(job.config, String(i + 1)));
          if (result.error) throw new Error(result.error);
          runs.push(result);
          completed++;
          self.postMessage({ type: 'progress', completed, total });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        results.push({ id: job.id, runs });
      } catch (error) {
        completed += job.samples - runs.length;
        results.push({
          id: job.id,
          error: error instanceof Error ? error.message : 'Invalid candidate.',
        });
      }
    }
    if (legacy && results[0].error) self.postMessage({ type: 'error', message: results[0].error });
    else if (legacy) self.postMessage({ type: 'result', runs: results[0].runs });
    else self.postMessage({ type: 'result', results });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Simulation failed.',
    });
  } finally {
    busy = false;
  }
};
