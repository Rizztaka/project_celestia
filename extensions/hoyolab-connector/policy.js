/* Shared by popup and its protocol tests. No network or cookie access here. */
globalThis.celestiaPolicy = Object.freeze({
  trustedPage(url) {
    try {
      const u = new URL(url);
      return u.origin === 'https://projectcelestia.vercel.app' && u.pathname === '/connect';
    } catch {
      return false;
    }
  },
  selectCookies(cookies) {
    const values = {};
    // Query the exact www.hoyolab.com URL; reject conflicting same-name cookies.
    for (const name of ['ltuid_v2', 'ltoken_v2', 'account_mid_v2', 'ltuid', 'ltoken']) {
      const matches = cookies.filter(
        (c) =>
          c.name === name &&
          c.secure &&
          c.path === '/' &&
          ['.hoyolab.com', 'hoyolab.com', 'www.hoyolab.com'].includes(c.domain),
      );
      const unique = [...new Set(matches.map((c) => c.value))];
      if (unique.length > 1)
        throw Error('Conflicting HoYoLAB sessions. Sign out of HoYoLAB and sign in again.');
      if (unique.length === 1 && /^[\x21-\x3a\x3c-\x7e]{1,2048}$/.test(unique[0]))
        values[name] = unique[0];
    }
    if (values.ltuid_v2 && values.ltoken_v2 && values.account_mid_v2)
      return {
        ltuid_v2: values.ltuid_v2,
        ltoken_v2: values.ltoken_v2,
        account_mid_v2: values.account_mid_v2,
      };
    if (values.ltuid && values.ltoken) return { ltuid: values.ltuid, ltoken: values.ltoken };
    throw Error('Sign in at HoYoLAB first, then return here.');
  },
});
