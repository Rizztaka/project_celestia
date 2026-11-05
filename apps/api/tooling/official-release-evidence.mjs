import { createHash } from 'node:crypto';

export const OFFICIAL_7_1_URL = 'https://genshin.hoyoverse.com/en/news/detail/166383';
export const OFFICIAL_7_1_PAYLOAD_URL =
  'https://sg-public-api-static.hoyoverse.com/content_v2_user/app/a1b1f9d3315447cc/getContent?iAppId=32&iInfoId=166383&sLangKey=en-us';
export const OFFICIAL_7_1_SOURCE_METADATA = Object.freeze({
  byteLength: 55735,
  sha256: 'fb270352333af4cfffcc49f5c80fb1bbff36b1daa7e2edbc6309a5961ea9b501',
  payloadUrl: OFFICIAL_7_1_PAYLOAD_URL,
  responseDate: 'Mon, 26 Oct 2026 14:14:58 GMT',
});
export const OFFICIAL_7_1_EVIDENCE_SHA256 =
  'ffead45bc7dfd0188ec368ef01b070b24f812da6910332f5b204b61740cd2470';
export const OFFICIAL_7_1_EXPECTED_CLAIMS = Object.freeze([
  Object.freeze({
    name: 'Vesna',
    element: 'Anemo',
    weaponType: 'Sword',
    releaseVersion: '7.1',
  }),
  Object.freeze({
    name: 'Vodyanitsa',
    element: 'Hydro',
    weaponType: 'Catalyst',
    releaseVersion: '7.1',
  }),
]);

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const text = (bytes) => Buffer.from(bytes).toString('utf8');
const decodeHtml = (html) =>
  html
    .replace(/<\/p\s*>|<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

function expectedEntry(claim) {
  return {
    name: claim.name,
    element: claim.element,
    weaponType: claim.weaponType,
    releaseVersion: claim.releaseVersion,
  };
}

export function extractOfficialReleasePayload(sourceBytes) {
  const result = (status, entries = [], publishedOn = null) => ({
    status,
    publishedOn,
    entries,
    extractionMethod:
      'Bounded content_v2 New Characters section; every heading and paragraph accounted for; 4/5-star claims only, no game IDs.',
  });
  let payload;
  try {
    if (sourceBytes.length > 2_000_000) return result('invalid');
    payload = JSON.parse(text(sourceBytes));
  } catch {
    return result('unavailable');
  }
  const data = payload?.data;
  if (
    payload?.retcode !== 0 ||
    data?.iInfoId !== 166383 ||
    typeof data.sTitle !== 'string' ||
    !/\bVersion 7\.1\b/.test(data.sTitle) ||
    typeof data.sContent !== 'string' ||
    !/^2026-09-23 (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(data.dtStartTime ?? '')
  )
    return result('invalid');
  const lines = decodeHtml(data.sContent)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.indexOf('I. New Characters');
  const end = lines.indexOf('II. New Equipment');
  if (
    start < 0 ||
    end <= start ||
    lines.filter((l) => l === 'I. New Characters').length !== 1 ||
    lines.filter((l) => l === 'II. New Equipment').length !== 1
  )
    return result('invalid');
  const entries = [];
  let current = null;
  let invalid = false;
  const finish = () => {
    if (!current) return;
    if (
      !current.name ||
      !current.weaponType ||
      !current.vision ||
      !current.description ||
      !current.summary
    )
      invalid = true;
    if (current.weaponType) entries.push(expectedEntry(current));
  };
  for (const line of lines.slice(start + 1, end)) {
    const heading =
      /^"[^"\n]+"\s+([^()\n]+?)\s+\((Anemo|Geo|Electro|Dendro|Hydro|Pyro|Cryo)\)\s+\([45]-Star\)$/.exec(
        line,
      );
    if (heading) {
      finish();
      current = { name: heading[1].trim(), element: heading[2], releaseVersion: '7.1' };
      continue;
    }
    if (!current) {
      invalid = true;
      continue;
    }
    const vision =
      /^◇ (?:Vision|Stellar Linchpin): (Anemo|Geo|Electro|Dendro|Hydro|Pyro|Cryo)$/.exec(line);
    const weapon = /^◇ Weapon: (Sword|Claymore|Polearm|Bow|Catalyst)$/.exec(line);
    if (vision) {
      if (current.vision || current.weaponType || vision[1] !== current.element) invalid = true;
      current.vision = vision[1];
    } else if (weapon) {
      if (current.weaponType || !current.vision) invalid = true;
      current.weaponType = weapon[1];
    } else if (
      /^◇ (?!.*(?:Weapon:|Vision:|Star\)|"))\S/.test(line) &&
      current.weaponType &&
      !current.description &&
      !current.summary
    ) {
      current.description = true;
    } else if (/^◆ \S/.test(line) && current.weaponType && !current.summary) {
      current.summary = true;
    } else invalid = true;
  }
  finish();
  if (!entries.length || new Set(entries.map((e) => e.name)).size !== entries.length)
    invalid = true;
  return result(invalid ? 'invalid' : 'parsed', entries, '2026-09-23');
}

export function verifyOfficialReleaseEvidence({
  evidence,
  evidenceBytes,
  evidenceHash,
  sourceBytes,
}) {
  const actualSourceHash = hash(sourceBytes);
  const artifact = evidence?.source?.artifact;
  const sourceIntegrity =
    evidence?.source?.url === OFFICIAL_7_1_URL &&
    artifact?.byteLength === sourceBytes.length &&
    artifact?.sha256 === actualSourceHash &&
    artifact?.byteLength === OFFICIAL_7_1_SOURCE_METADATA.byteLength &&
    artifact?.sha256 === OFFICIAL_7_1_SOURCE_METADATA.sha256 &&
    artifact?.payloadUrl === OFFICIAL_7_1_PAYLOAD_URL &&
    evidence?.source?.payloadUrl === OFFICIAL_7_1_PAYLOAD_URL &&
    artifact?.responseDate === OFFICIAL_7_1_SOURCE_METADATA.responseDate;
  const evidenceIntegrity =
    evidenceHash === hash(evidenceBytes) &&
    evidenceHash === OFFICIAL_7_1_EVIDENCE_SHA256 &&
    JSON.stringify(evidence) === JSON.stringify(JSON.parse(text(evidenceBytes))) &&
    evidence?.source?.artifact?.sha256 === actualSourceHash &&
    evidence?.source?.artifact?.byteLength === sourceBytes.length;
  const extraction = evidence?.extraction;
  const extracted = extractOfficialReleasePayload(sourceBytes);
  const storedEntries = Array.isArray(extraction?.entries) ? extraction.entries : null;
  const extractionIntegrity =
    extracted.status === 'parsed' &&
    JSON.stringify(storedEntries) === JSON.stringify(extracted.entries) &&
    extraction?.publishedOn === extracted.publishedOn;
  const claimsIntegrity =
    extracted.status === 'parsed' &&
    storedEntries !== null &&
    OFFICIAL_7_1_EXPECTED_CLAIMS.every((claim) =>
      storedEntries.some((entry) =>
        Object.entries(expectedEntry(claim)).every(([key, value]) => entry[key] === value),
      ),
    ) &&
    storedEntries.length === OFFICIAL_7_1_EXPECTED_CLAIMS.length;
  const mismatches = OFFICIAL_7_1_EXPECTED_CLAIMS.filter(
    (claim) =>
      !storedEntries?.some((entry) =>
        Object.entries(expectedEntry(claim)).every(([key, value]) => entry[key] === value),
      ),
  ).map((claim) => claim.name);
  const status =
    !sourceIntegrity || !evidenceIntegrity || !extractionIntegrity
      ? 'invalid'
      : extracted.status === 'unavailable'
        ? 'unavailable'
        : claimsIntegrity
          ? 'unverified'
          : 'invalid';
  return {
    status,
    // No independently approved historical/source attestation is registered. Matching
    // hashes and a fresh HTTPS retrieval cannot manufacture that missing approval.
    provenance: 'unverified',
    reviewAnchor: null,
    sourceIntegrity,
    evidenceIntegrity,
    extractionIntegrity,
    claimsIntegrity,
    mismatches,
    source: evidence?.source ?? null,
    entries: extracted.entries,
  };
}
