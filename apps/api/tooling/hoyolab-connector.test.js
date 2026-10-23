import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { inflateRawSync } from 'node:zlib';

import { describe, expect, it, vi } from 'vitest';

const source = (name) =>
  readFileSync(new URL(`../../../extensions/hoyolab-connector/${name}`, import.meta.url), 'utf8');
function policy() {
  const scope = vm.createContext({ URL });
  vm.runInContext(source('policy.js'), scope);
  return scope.celestiaPolicy;
}
describe('HoYoLAB connector explicit-action boundary', () => {
  it('ships exactly the reviewed connector files in the downloadable zip', () => {
    const zip = readFileSync(
      new URL('../../web/public/downloads/celestia-hoyolab-connector.zip', import.meta.url),
    );
    const names = [];
    let offset = 0;
    while (zip.readUInt32LE(offset) === 0x04034b50) {
      expect(zip.readUInt16LE(offset + 6) & 8).toBe(0);
      const method = zip.readUInt16LE(offset + 8),
        size = zip.readUInt32LE(offset + 18);
      const nameLength = zip.readUInt16LE(offset + 26),
        extraLength = zip.readUInt16LE(offset + 28);
      const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString();
      expect([
        'README.md',
        'bridge.js',
        'manifest.json',
        'policy.js',
        'popup.css',
        'popup.html',
        'popup.js',
      ]).toContain(name);
      const start = offset + 30 + nameLength + extraLength;
      const compressed = zip.subarray(start, start + size);
      const bytes = method === 8 ? inflateRawSync(compressed) : compressed;
      expect(bytes.equals(Buffer.from(source(name).replaceAll('\r\n', '\n')))).toBe(true);
      names.push(name);
      offset = start + size;
    }
    expect(names.sort()).toEqual(
      [
        'README.md',
        'bridge.js',
        'manifest.json',
        'policy.js',
        'popup.css',
        'popup.html',
        'popup.js',
      ].sort(),
    );
    expect(zip.readUInt32LE(offset)).toBe(0x02014b50);
  });
  it('trusts only the exact production Connect page', () => {
    const p = policy();
    expect(p.trustedPage('https://projectcelestia.vercel.app/connect')).toBe(true);
    for (const url of [
      'http://projectcelestia.vercel.app/connect',
      'https://projectcelestia.vercel.app.attacker.test/connect',
      'https://attacker.test/connect',
      'https://projectcelestia.vercel.app/roster',
      'http://localhost:5173/connect',
      'invalid',
    ])
      expect(p.trustedPage(url)).toBe(false);
    const m = JSON.parse(source('manifest.json'));
    expect(m.permissions).toEqual(['cookies', 'activeTab']);
    expect(m.externally_connectable).toBeUndefined();
    expect(m.background).toBeUndefined();
    expect(m.content_scripts[0].matches).toEqual(['https://projectcelestia.vercel.app/connect']);
  });
  it('selects only minimal secure session cookies and rejects ambiguous duplicates', () => {
    const p = policy(),
      cookie = (name, value) => ({ name, value, domain: '.hoyolab.com', path: '/', secure: true });
    const jar = [
      cookie('ltuid_v2', 'user'),
      cookie('ltoken_v2', 'token'),
      cookie('account_mid_v2', 'mid'),
      cookie('cookie_token_v2', 'must-not-leave'),
      cookie('stoken', 'must-not-leave'),
    ];
    expect({ ...p.selectCookies(jar) }).toEqual({
      ltuid_v2: 'user',
      ltoken_v2: 'token',
      account_mid_v2: 'mid',
    });
    expect(() => p.selectCookies([...jar, cookie('ltoken_v2', 'other')])).toThrow('Conflicting');
    expect(() => p.selectCookies(jar.map((c) => ({ ...c, secure: false })))).toThrow('Sign in');
    expect(() => p.selectCookies(jar.map((c) => ({ ...c, domain: '.attacker.test' })))).toThrow(
      'Sign in',
    );
  });
  it('cannot read cookies from a web message; handoff needs current nonce and trusted extension sender', () => {
    let pageListener,
      extensionListener,
      now = 1000;
    const postMessage = vi.fn();
    const window = {
      addEventListener: (_type, callback) => {
        pageListener = callback;
      },
      postMessage,
    };
    const scope = vm.createContext({
      window,
      location: { origin: 'https://projectcelestia.vercel.app' },
      Date: { now: () => now },
      chrome: {
        runtime: {
          id: 'fixture-extension',
          onMessage: {
            addListener: (callback) => {
              extensionListener = callback;
            },
          },
        },
      },
    });
    vm.runInContext(source('bridge.js'), scope);
    const nonce = 'a'.repeat(64),
      sender = { id: 'fixture-extension' };
    const message = (data) =>
      pageListener({ source: window, origin: 'https://projectcelestia.vercel.app', data });
    const reply = vi.fn();
    extensionListener({ type: 'CELESTIA_HOYOLAB_DELIVER', nonce, cookies: {} }, sender, reply);
    expect(reply).toHaveBeenLastCalledWith({ ok: false });
    message({ type: 'CELESTIA_HOYOLAB_ARM', nonce });
    extensionListener({ type: 'CELESTIA_HOYOLAB_INTENT' }, { id: 'foreign-extension' }, reply);
    expect(reply).toHaveBeenCalledTimes(1);
    extensionListener(
      { type: 'CELESTIA_HOYOLAB_DELIVER', nonce, cookies: { synthetic: 'test' } },
      sender,
      reply,
    );
    expect(reply).toHaveBeenLastCalledWith({ ok: true });
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'CELESTIA_HOYOLAB_CREDENTIALS', nonce, cookies: { synthetic: 'test' } },
      'https://projectcelestia.vercel.app',
    );
    extensionListener({ type: 'CELESTIA_HOYOLAB_DELIVER', nonce, cookies: {} }, sender, reply);
    expect(reply).toHaveBeenLastCalledWith({ ok: false });
    message({ type: 'CELESTIA_HOYOLAB_ARM', nonce });
    now += 120001;
    extensionListener({ type: 'CELESTIA_HOYOLAB_DELIVER', nonce, cookies: {} }, sender, reply);
    expect(reply).toHaveBeenLastCalledWith({ ok: false });
    expect(source('bridge.js')).not.toContain('chrome.cookies');
  });
});
