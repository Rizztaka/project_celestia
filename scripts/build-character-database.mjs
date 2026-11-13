import fs from 'fs';
import { execSync } from 'child_process';

const profilesRaw = execSync('git show v1-legacy:apps/api/src/games/genshin/static/character-profiles.json', { maxBuffer: 10 * 1024 * 1024 }).toString();
const profiles = JSON.parse(profilesRaw);

const releaseRaw = execSync('git show v1-legacy:apps/api/src/games/genshin/static/release-roster.json', { maxBuffer: 10 * 1024 * 1024 }).toString();
const release = JSON.parse(releaseRaw);

const validVersions = new Set([
  '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6',
  '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8',
  '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7',
  '4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8',
  '5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '6.0', '6.1'
]);

// Determine weapon mapping
const WEAPON_MAP = {
  'WEAPON_SWORD_ONE_HAND': 'Sword',
  'Sword': 'Sword',
  'WEAPON_CLAYMORE': 'Claymore',
  'Claymore': 'Claymore',
  'WEAPON_POLE': 'Polearm',
  'Polearm': 'Polearm',
  'WEAPON_BOW': 'Bow',
  'Bow': 'Bow',
  'WEAPON_CATALYST': 'Catalyst',
  'Catalyst': 'Catalyst',
};

// Known heuristics for roles
const SUSTAINS = new Set([
  'Barbara', 'Qiqi', 'Diona', 'Bennett', 'Jean', 'Noelle', 'Zhongli',
  'SangonomiyaKokomi', 'Sayu', 'Thoma', 'KukiShinobu', 'Dori', 'Layla',
  'Yaoyao', 'Baizhu', 'Mika', 'Kirara', 'Charlotte', 'Chevreuse',
  'Xianyun', 'Sigewinne', 'Xilonen', 'Citlali'
]);

const BUFFERS = new Set([
  'Bennett', 'KaedeharaKazuha', 'Sucrose', 'Faruzan', 'Gorou', 'YunJin',
  'Shenhe', 'KujouSara', 'Candace', 'Mika', 'Furina', 'Chevreuse',
  'Xianyun', 'Xilonen', 'Citlali', 'Nahida', 'Mona', 'Iansan', 'Lauma', 'LanYan'
]);

const OFF_FIELD_DPS = new Set([
  'Xiangling', 'Xingqiu', 'Fischl', 'Beidou', 'Rosaria', 'Albedo', 'Yelan',
  'YaeMiko', 'Collei', 'KukiShinobu', 'Nahida', 'Layla', 'Dehya', 'Lynette',
  'Furina', 'Chiori', 'Emilie', 'Kachina', 'Ororon', 'Mavuika', 'Kaeya', 'Lisa', 'Aino'
]);

const enkaEntries = [];
const characterEntries = [];

// Base curated list mapping to ensure our rich descriptions & tags are prioritized
const curatedMap = new Map();

for (const entry of release.releaseEntries) {
  if (!validVersions.has(entry.releaseVersion) && !entry.key.startsWith('Traveler')) continue;
  if (!entry.element || entry.element === 'None') continue;

  const key = entry.key;
  const prof = profiles[key] || {};
  const name = prof.name || entry.sourceName;
  const element = entry.element;
  const weapon = WEAPON_MAP[entry.weaponType] || WEAPON_MAP[prof.weaponType] || 'Sword';
  const rarity = prof.rarity || (['Amber', 'Kaeya', 'Lisa', 'Barbara', 'Xiangling', 'Xingqiu', 'Bennett', 'Noelle', 'Fischl', 'Sucrose', 'Beidou', 'Ningguang', 'Razor', 'Chongyun', 'Diona', 'Xinyan', 'Rosaria', 'Yanfei', 'Sayu', 'KujouSara', 'Thoma', 'Gorou', 'YunJin', 'KukiShinobu', 'ShikanoinHeizou', 'Collei', 'Dori', 'Candace', 'Layla', 'Faruzan', 'Yaoyao', 'Mika', 'Kaveh', 'Lynette', 'Freminet', 'Charlotte', 'Chevreuse', 'Gaming', 'Sethos', 'Kachina', 'Ororon', 'LanYan', 'Iansan'].includes(key) ? 4 : 5);

  const roles = [];
  if (SUSTAINS.has(key)) roles.push('Sustain');
  if (BUFFERS.has(key)) roles.push('Buffer/Shred');
  if (OFF_FIELD_DPS.has(key)) roles.push('Off-Field DPS');
  if (roles.length === 0 || (!SUSTAINS.has(key) && !BUFFERS.has(key) && roles.length <= 1)) {
    roles.unshift('On-Field DPS');
  }

  const tags = [element, weapon];
  if (entry.releaseVersion?.startsWith('5.')) tags.push('Nightsoul');
  if (key === 'Nefer' || key === 'Lauma') tags.push('Lunar-Bloom', 'Nod-Krai');
  if (key === 'Furina') tags.push('Universal-Buffer', 'Fanfare');
  if (key === 'Xilonen') tags.push('Cinder-City', 'Universal-Buffer', 'RES-Shred');
  if (['KaedeharaKazuha', 'Sucrose', 'Venti', 'Jean', 'Xianyun'].includes(key)) tags.push('VV', 'Swirl');
  if (['Bennett', 'Xiangling', 'HuTao', 'Diluc', 'Yoimiya', 'Arlecchino', 'Gaming', 'Mavuika'].includes(key)) tags.push('Vaporize', 'Melt');
  if (['KukiShinobu', 'RaidenShogun', 'Dori'].includes(key)) tags.push('Hyperbloom-Trigger');
  if (['Nahida', 'Alhaitham', 'Tighnari', 'Baizhu', 'Kirara', 'Yaoyao', 'Emilie'].includes(key)) tags.push('Quicken', 'Spread', 'Bloom');

  const desc = prof.description ? prof.description.replace(/[\r\n]+/g, ' ') : `${name} is a ${rarity}-star ${element} ${weapon} wielder.`;

  characterEntries.push({
    id: key,
    name,
    element,
    weapon,
    rarity,
    roles,
    tags: Array.from(new Set(tags)),
    description: desc,
  });

  if (entry.gameId) {
    enkaEntries.push(`  ${entry.gameId}: '${key}',`);
  }
}

// Write src/data/characters.ts
const code = `import type { Character } from '../types/genshin';

export const CHARACTERS: Character[] = ${JSON.stringify(characterEntries, null, 2)};
`;

fs.writeFileSync('src/data/characters.ts', code);
console.log('Successfully generated', characterEntries.length, 'characters into src/data/characters.ts');

// Write enka map
const enkaFileContent = `export interface EnkaFetchResult {
  success: boolean;
  nickname?: string;
  avatarIds: string[];
  error?: string;
}

// Complete Enka gameId mapping for all ${characterEntries.length} characters
const ENKA_ID_MAP: Record<number, string> = {
${enkaEntries.join('\n')}
};

export async function fetchShowcaseFromEnka(uid: string): Promise<EnkaFetchResult> {
  const cleanUid = uid.trim();
  if (!/^\\d{9,10}$/.test(cleanUid)) {
    return { success: false, avatarIds: [], error: 'Invalid UID. Genshin UIDs are 9 or 10 digits.' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(\`https://enka.network/api/uid/\${cleanUid}\`, {
      headers: { 'User-Agent': 'Celestia-Client/2.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, avatarIds: [], error: 'Player UID not found on Enka. Ensure the UID is correct.' };
      }
      if (res.status === 429) {
        return { success: false, avatarIds: [], error: 'Enka rate limit reached. Please wait a moment and try again.' };
      }
      return { success: false, avatarIds: [], error: \`Enka returned status code \${res.status}.\` };
    }

    const data = await res.json();
    const avatarList: number[] = data?.playerInfo?.showAvatarInfoList?.map((a: { avatarId: number }) => a.avatarId) || [];
    const matchedKeys: string[] = [];

    for (const id of avatarList) {
      if (ENKA_ID_MAP[id]) {
        matchedKeys.push(ENKA_ID_MAP[id]);
      }
    }

    return {
      success: true,
      nickname: data?.playerInfo?.nickname || 'Traveler',
      avatarIds: matchedKeys,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      avatarIds: [],
      error: errorMsg.includes('abort')
        ? 'Network timed out connecting to Enka.'
        : 'Could not connect directly to Enka. You can still select characters manually below!',
    };
  }
}
`;

fs.writeFileSync('src/services/enka.ts', enkaFileContent);
console.log('Successfully updated src/services/enka.ts with complete mapping');
