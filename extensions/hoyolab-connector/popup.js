const button = document.getElementById('connect');
button.addEventListener('click', async () => {
  button.disabled = true;
  const status = document.getElementById('status');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !celestiaPolicy.trustedPage(tab.url))
      throw Error('Open Celestia’s Connect page in this tab first.');
    const intent = await chrome.tabs.sendMessage(tab.id, { type: 'CELESTIA_HOYOLAB_INTENT' });
    if (!intent?.nonce) throw Error('Choose “Ready to connect” on Celestia first.');
    const cookies = celestiaPolicy.selectCookies(
      await chrome.cookies.getAll({ url: 'https://www.hoyolab.com/' }),
    );
    // Recheck the tab after cookie access; navigation invalidates the handoff.
    const current = await chrome.tabs.get(tab.id);
    if (!celestiaPolicy.trustedPage(current.url))
      throw Error('Return to Celestia’s Connect page and try again.');
    const result = await chrome.tabs.sendMessage(tab.id, {
      type: 'CELESTIA_HOYOLAB_DELIVER',
      nonce: intent.nonce,
      cookies,
    });
    if (!result?.ok) throw Error('Connection request expired. Choose “Ready to connect” again.');
    status.textContent = 'Session sent. Check Celestia for the connection result.';
  } catch (error) {
    // Never display Chrome errors which might include message payloads.
    status.textContent =
      error instanceof Error && !/receiving end|message port|extension context/i.test(error.message)
        ? error.message
        : 'Reload Celestia’s Connect page and try again.';
  } finally {
    button.disabled = false;
  }
});
