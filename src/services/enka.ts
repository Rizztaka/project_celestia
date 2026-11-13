export interface EnkaFetchResult {
  success: boolean;
  nickname?: string;
  avatarIds: string[];
  error?: string;
}

// Complete Enka gameId mapping for all 120 characters
const ENKA_ID_MAP: Record<number, string> = {
  10000121: 'Aino',
  10000038: 'Albedo',
  10000078: 'Alhaitham',
  10000062: 'Aloy',
  10000148: 'Alyosha',
  10000021: 'Amber',
  10000057: 'AratakiItto',
  10000096: 'Arlecchino',
  10000082: 'Baizhu',
  10000014: 'Barbara',
  10000024: 'Beidou',
  10000032: 'Bennett',
  10000072: 'Candace',
  10000088: 'Charlotte',
  10000104: 'Chasca',
  10000090: 'Chevreuse',
  10000094: 'Chiori',
  10000036: 'Chongyun',
  10000107: 'Citlali',
  10000098: 'Clorinde',
  10000067: 'Collei',
  10000125: 'Columbina',
  10000071: 'Cyno',
  10000115: 'Dahlia',
  10000079: 'Dehya',
  10000016: 'Diluc',
  10000039: 'Diona',
  10000068: 'Dori',
  10000123: 'Durin',
  10000099: 'Emilie',
  10000112: 'Escoffier',
  10000051: 'Eula',
  10000076: 'Faruzan',
  10000031: 'Fischl',
  10000120: 'Flins',
  10000085: 'Freminet',
  10000089: 'Furina',
  10000092: 'Gaming',
  10000037: 'Ganyu',
  10000055: 'Gorou',
  10000046: 'HuTao',
  10000110: 'Iansan',
  10000113: 'Ifa',
  10000127: 'Illuga',
  10000116: 'Ineffa',
  10000124: 'Jahoda',
  10000003: 'Jean',
  10000100: 'Kachina',
  10000047: 'KaedeharaKazuha',
  10000015: 'Kaeya',
  10000002: 'KamisatoAyaka',
  10000066: 'KamisatoAyato',
  10000081: 'Kaveh',
  10000042: 'Keqing',
  10000101: 'Kinich',
  10000061: 'Kirara',
  10000029: 'Klee',
  10000056: 'KujouSara',
  10000065: 'KukiShinobu',
  10000108: 'LanYan',
  10000119: 'Lauma',
  10000074: 'Layla',
  10000130: 'Linnea',
  10000006: 'Lisa',
  10000129: 'Lohen',
  10000083: 'Lynette',
  10000084: 'Lyney',
  10000106: 'Mavuika',
  10000080: 'Mika',
  10000041: 'Mona',
  10000102: 'Mualani',
  10000073: 'Nahida',
  10000091: 'Navia',
  10000122: 'Nefer',
  10000087: 'Neuvillette',
  10000131: 'Nicole',
  10000070: 'Nilou',
  10000027: 'Ningguang',
  10000034: 'Noelle',
  10000150: 'Odette',
  10000105: 'Ororon',
  10000132: 'Prune',
  10000035: 'Qiqi',
  10000052: 'RaidenShogun',
  10000020: 'Razor',
  10000045: 'Rosaria',
  10000133: 'Sandrone',
  10000054: 'SangonomiyaKokomi',
  10000053: 'Sayu',
  10000097: 'Sethos',
  10000063: 'Shenhe',
  10000059: 'ShikanoinHeizou',
  10000095: 'Sigewinne',
  10000114: 'Skirk',
  10000043: 'Sucrose',
  10000033: 'Tartaglia',
  10000050: 'Thoma',
  10000069: 'Tighnari',
  10000111: 'Varesa',
  10000128: 'Varka',
  10000022: 'Venti',
  10000143: 'Vesna',
  10000140: 'Vodyanitsa',
  10000075: 'Wanderer',
  10000086: 'Wriothesley',
  10000023: 'Xiangling',
  10000093: 'Xianyun',
  10000026: 'Xiao',
  10000103: 'Xilonen',
  10000025: 'Xingqiu',
  10000044: 'Xinyan',
  10000058: 'YaeMiko',
  10000048: 'Yanfei',
  10000077: 'Yaoyao',
  10000060: 'Yelan',
  10000049: 'Yoimiya',
  10000109: 'YumemizukiMizuki',
  10000064: 'YunJin',
  10000030: 'Zhongli',
  10000126: 'Zibai',
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
