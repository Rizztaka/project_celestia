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
    if (
      typeof data.config !== 'string' ||
      data.config.length > 40000 ||
      !Number.isInteger(data.samples) ||
      data.samples < 1 ||
      data.samples > 50 ||
      !/^[a-f0-9]{64}$/.test(data.hash)
    )
      throw new Error('Invalid simulation request.');
    self.postMessage({ type: 'loading' });
    await initialize(data.hash);
    const runs = [];
    for (let i = 0; i < data.samples; i++) {
      const result = JSON.parse(runCelestia(data.config, String(i + 1)));
      if (result.error) throw new Error(result.error);
      runs.push(result);
      self.postMessage({ type: 'progress', completed: i + 1, total: data.samples });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    self.postMessage({ type: 'result', runs });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Simulation failed.',
    });
  } finally {
    busy = false;
  }
};
