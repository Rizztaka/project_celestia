(() => {
  // No page message can read cookies. Only the popup, opened by the player, can.
  let armed = null;
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const m = event.data;
    if (m?.type === 'CELESTIA_HOYOLAB_DISARM') armed = null;
    if (m?.type === 'CELESTIA_HOYOLAB_ARM' && /^[a-f0-9]{64}$/.test(m.nonce))
      armed = { nonce: m.nonce, expires: Date.now() + 120000 };
    if (m?.type === 'CELESTIA_HOYOLAB_PING')
      window.postMessage({ type: 'CELESTIA_HOYOLAB_READY', version: 1 }, location.origin);
  });
  chrome.runtime.onMessage.addListener((m, sender, respond) => {
    if (sender.id !== chrome.runtime.id) return;
    if (m?.type === 'CELESTIA_HOYOLAB_INTENT') {
      respond(armed && armed.expires > Date.now() ? { nonce: armed.nonce } : null);
      return;
    }
    if (
      m?.type !== 'CELESTIA_HOYOLAB_DELIVER' ||
      !armed ||
      armed.expires <= Date.now() ||
      m.nonce !== armed.nonce
    ) {
      respond({ ok: false });
      return;
    }
    const nonce = armed.nonce;
    armed = null;
    window.postMessage(
      { type: 'CELESTIA_HOYOLAB_CREDENTIALS', nonce, cookies: m.cookies },
      location.origin,
    );
    respond({ ok: true });
  });
})();
