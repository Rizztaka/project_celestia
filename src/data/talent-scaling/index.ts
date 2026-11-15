export interface TalentScalingCombatSkill {
  name: string;
  labels: string[];
  parameters: Record<string, number[]>;
}

export interface TalentScalingData {
  characterId: string;
  name: string;
  normal?: TalentScalingCombatSkill;
  skill?: TalentScalingCombatSkill;
  burst?: TalentScalingCombatSkill;
}

export const AVAILABLE_SCALING_KEYS: string[] = [
  "aino",
  "albedo",
  "alhaitham",
  "aloy",
  "alyosha",
  "amber",
  "aratakiitto",
  "arlecchino",
  "baizhu",
  "barbara",
  "beidou",
  "bennett",
  "candace",
  "charlotte",
  "chasca",
  "chevreuse",
  "chiori",
  "chongyun",
  "citlali",
  "clorinde",
  "collei",
  "columbina",
  "cyno",
  "dahlia",
  "dehya",
  "diluc",
  "diona",
  "dori",
  "durin",
  "emilie",
  "escoffier",
  "eula",
  "faruzan",
  "fischl",
  "flins",
  "freminet",
  "furina",
  "gaming",
  "ganyu",
  "gorou",
  "hutao",
  "iansan",
  "ifa",
  "illuga",
  "ineffa",
  "jahoda",
  "jean",
  "kachina",
  "kaedeharakazuha",
  "kaeya",
  "kamisatoayaka",
  "kamisatoayato",
  "kaveh",
  "keqing",
  "kinich",
  "kirara",
  "klee",
  "kujousara",
  "kukishinobu",
  "lanyan",
  "lauma",
  "layla",
  "linnea",
  "lisa",
  "lohen",
  "lynette",
  "lyney",
  "mavuika",
  "mika",
  "mitya",
  "mona",
  "mualani",
  "nahida",
  "navia",
  "nefer",
  "neuvillette",
  "nicole",
  "nilou",
  "ningguang",
  "noelle",
  "odette",
  "ororon",
  "prune",
  "qiqi",
  "raidenshogun",
  "razor",
  "rosaria",
  "sandrone",
  "sangonomiyakokomi",
  "sayu",
  "sethos",
  "shenhe",
  "shikanoinheizou",
  "sigewinne",
  "skirk",
  "sucrose",
  "tartaglia",
  "thoma",
  "tighnari",
  "valeriy",
  "varesa",
  "varka",
  "venti",
  "vesna",
  "vodyanitsa",
  "wanderer",
  "wriothesley",
  "xiangling",
  "xianyun",
  "xiao",
  "xilonen",
  "xingqiu",
  "xinyan",
  "yaemiko",
  "yanfei",
  "yaoyao",
  "yelan",
  "yoimiya",
  "yumemizukimizuki",
  "yunjin",
  "zhongli",
  "zibai",
  "traveleranemo",
  "travelergeo",
  "travelerelectro",
  "travelerdendro",
  "travelerhydro",
  "travelerpyro"
];

export const SCALING_ALIASES: Record<string, string> = {
  kazuha: 'kaedeharakazuha',
  raiden: 'raidenshogun',
  ayaka: 'kamisatoayaka',
  ayato: 'kamisatoayato',
  itto: 'aratakiitto',
  kokomi: 'sangonomiyakokomi',
  heizou: 'shikanoinheizou',
  sara: 'kujousara',
  shinobu: 'kukishinobu',
  mizuki: 'yumemizukimizuki',
  traveler: 'traveleranemo',
};

const TALENT_SCALING_CACHE = new Map<string, TalentScalingData>();

/**
 * Lazy loads talent scaling curve data for a given character ID or name.
 */
export async function getTalentScaling(characterIdOrName: string): Promise<TalentScalingData | undefined> {
  if (!characterIdOrName) return undefined;
  let key = characterIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SCALING_ALIASES[key]) {
    key = SCALING_ALIASES[key];
  }
  if (TALENT_SCALING_CACHE.has(key)) {
    return TALENT_SCALING_CACHE.get(key);
  }
  try {
    const mod = await import(`./data/${key}.json`);
    const data: TalentScalingData = mod.default || mod;
    TALENT_SCALING_CACHE.set(key, data);
    return data;
  } catch {
    return undefined;
  }
}
