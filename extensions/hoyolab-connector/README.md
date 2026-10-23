# Celestia HoYoLAB connector (Chromium desktop)

1. Download and unzip the connector from Celestia’s Account page.
2. In Chrome or Edge, open Extensions, enable Developer mode, then Load unpacked and choose the unzipped folder.
3. Reload Celestia, sign in on the official HoYoLAB website, then use Ready to connect in Celestia and Connect HoYoLAB in the extension.

This is an unpacked development release, not a Chrome Web Store listing. Mobile browsers are not supported. No remote code, storage, telemetry, background scripts or external-message cookie handlers. Cookie access happens only in the popup’s explicit Connect click. The content script runs only on the production Celestia Connect page. It hands over a one-use, expiring, page-issued intent. Only the minimal ltuid/ltoken session family is transferred; no password, stoken or cookie_token. Credentials are encrypted by the Celestia backend for automatic read-only refresh. Disconnect there to remove its stored session. HoYoLAB may require verification on its own website.

Build the downloadable zip with `node tooling/build-hoyolab-connector.mjs`. Inspect its source here before installation. Do not distribute a development manifest trusting localhost.
