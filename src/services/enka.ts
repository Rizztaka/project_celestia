export interface EnkaFetchResult {
  success: boolean;
  nickname?: string;
  avatarIds: string[];
  error?: string;
}

// Map from Enka character ID numbers to Celestia character IDs
const ENKA_ID_MAP: Record<number, string> = {
  10000022: 'Venti',
  10000030: 'Zhongli',
  10000052: 'RaidenShogun',
  10000073: 'Nahida',
  10000089: 'Furina',
  10000104: 'Mavuika',
  10000099: 'Xilonen',
  10000101: 'Chasca',
  10000102: 'Citlali',
  10000106: 'Nefer',
  10000105: 'Lauma',
  10000087: 'Neuvillette',
  10000046: 'HuTao',
  10000078: 'Alhaitham',
  10000098: 'Clorinde',
  10000096: 'Arlecchino',
  10000091: 'Navia',
  10000070: 'Nilou',
  10000082: 'Baizhu',
  10000093: 'Xianyun',
  10000047: 'KaedeharaKazuha',
  10000060: 'Yelan',
  10000025: 'Xingqiu',
  10000032: 'Bennett',
  10000023: 'Xiangling',
  10000065: 'KukiShinobu',
  10000043: 'Sucrose',
  10000031: 'Fischl',
  10000054: 'SangonomiyaKokomi',
  10000002: 'KamisatoAyaka',
  10000037: 'Ganyu',
  10000063: 'Shenhe',
  10000086: 'Wriothesley',
  10000033: 'Tartaglia',
  10000058: 'YaeMiko',
  10000071: 'Cyno',
  10000026: 'Xiao',
  10000075: 'Wanderer',
  10000057: 'AratakiItto',
  10000055: 'Gorou',
  10000024: 'Beidou',
  10000039: 'Diona',
  10000074: 'Layla',
  10000069: 'Tighnari',
  10000092: 'Gaming',
  10000053: 'Thoma',
  10000097: 'Sethos',
  10000100: 'Ororon',
  10000095: 'Chevreuse',
  10000094: 'Kachina',
  10000103: 'Kinich',
};

export async function fetchShowcaseFromEnka(uid: string): Promise<EnkaFetchResult> {
  const cleanUid = uid.trim();
  if (!/^\d{9,10}$/.test(cleanUid)) {
    return { success: false, avatarIds: [], error: 'Invalid UID. Genshin UIDs are 9 or 10 digits.' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://enka.network/api/uid/${cleanUid}`, {
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
      return { success: false, avatarIds: [], error: `Enka returned status code ${res.status}.` };
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
