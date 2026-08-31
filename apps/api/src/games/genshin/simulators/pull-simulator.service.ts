import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const activeBannersData = require('../static/active-banners.json');

export interface Banner {
  bannerId: string;
  name: string;
  type: string;
  fiveStarKey: string;
  fourStarKeys: string[];
  endDate: string;
}

export interface PullRequest {
  bannerId: string;
  count: number; // usually 1 or 10
  currentPity5: number;
  currentPity4: number;
  guaranteed5: boolean;
  guaranteed4: boolean;
}

export interface PullResultItem {
  id: string; // random UUID for react key
  type: '3_STAR' | '4_STAR' | '5_STAR';
  itemKey: string; // Character or Weapon name
  isFeatured: boolean;
}

export interface PullSimulationResult {
  pulls: PullResultItem[];
  endPity5: number;
  endPity4: number;
  endGuaranteed5: boolean;
  endGuaranteed4: boolean;
}

const STANDARD_5_STARS = ['Diluc', 'Jean', 'Mona', 'Qiqi', 'Keqing', 'Tighnari', 'Dehya'];
const STANDARD_4_STARS = [
  'Amber',
  'Kaeya',
  'Lisa',
  'Barbara',
  'Razor',
  'Xiangling',
  'Beidou',
  'Xingqiu',
  'Ningguang',
  'Fischl',
  'Bennett',
  'Noelle',
  'Chongyun',
  'Sucrose',
  'Diona',
  'Xinyan',
  'Rosaria',
  'Yanfei',
  'Sayu',
  'KujouSara',
  'Thoma',
  'Gorou',
  'YunJin',
  'Collei',
  'Dori',
  'Candace',
  'Layla',
  'Faruzan',
  'Yaoyao',
  'Mika',
  'Kaveh',
  'Kirara',
  'Lynette',
  'Freminet',
  'Charlotte',
  'Chevreuse',
  'Gaming',
  'Sethos',
  'Kachina',
];
const WEAPONS_3_STAR = [
  'Harbinger of Dawn',
  'Slingshot',
  'Thrilling Tales of Dragon Slayers',
  'Black Tassel',
  'Debate Club',
  'Bloodtainted Greatsword',
  'Cool Steel',
  "Sharpshooter's Oath",
  'Magic Guide',
];

export class PullSimulatorService {
  private getBanner(bannerId: string): Banner {
    const banner = activeBannersData.banners.find((b: Banner) => b.bannerId === bannerId);
    if (!banner) throw new Error(`Banner ${bannerId} not found`);
    return banner;
  }

  public simulatePulls(request: PullRequest): PullSimulationResult {
    const banner = this.getBanner(request.bannerId);
    const pulls: PullResultItem[] = [];

    let pity5 = request.currentPity5;
    let pity4 = request.currentPity4;
    let guaranteed5 = request.guaranteed5;
    let guaranteed4 = request.guaranteed4;

    for (let i = 0; i < request.count; i++) {
      pity5++;
      pity4++;

      // Determine 5-star probability
      // Base: 0.006. Soft pity starts at 74, adds 0.06 per pull. Hard pity at 90.
      let prob5 = 0.006;
      if (pity5 >= 90) {
        prob5 = 1.0;
      } else if (pity5 >= 74) {
        prob5 = 0.006 + (pity5 - 73) * 0.06;
      }

      // Roll for 5-star
      if (Math.random() <= prob5) {
        // We got a 5-star!
        const win5050 = guaranteed5 || Math.random() < 0.5;
        const itemKey = win5050
          ? banner.fiveStarKey
          : STANDARD_5_STARS[Math.floor(Math.random() * STANDARD_5_STARS.length)];

        pulls.push({
          id: Math.random().toString(36).substring(7),
          type: '5_STAR',
          itemKey,
          isFeatured: win5050,
        });

        // Reset state
        pity5 = 0;
        guaranteed5 = !win5050; // If we lost 50/50, next is guaranteed
        // Pulling a 5-star doesn't reset 4-star pity in some games, but in Genshin it does if it replaces the 4-star roll?
        // Actually, in Genshin 4-star pity counts independently, but a 5-star doesn't reset it.
        // For simplicity, we just continue.
        continue;
      }

      // Determine 4-star probability
      // Base: 0.051. Hard pity at 10. (Genshin has soft pity around 9, but simplified: 1.0 at 10)
      let prob4 = 0.051;
      if (pity4 >= 10) {
        prob4 = 1.0;
      } else if (pity4 === 9) {
        prob4 = 0.561; // Standard soft pity approximation for 4-star
      }

      // Roll for 4-star
      if (Math.random() <= prob4) {
        // We got a 4-star!
        const win5050 = guaranteed4 || Math.random() < 0.5;
        let itemKey = '';
        if (win5050) {
          itemKey = banner.fourStarKeys[Math.floor(Math.random() * banner.fourStarKeys.length)];
        } else {
          itemKey = STANDARD_4_STARS[Math.floor(Math.random() * STANDARD_4_STARS.length)];
        }

        pulls.push({
          id: Math.random().toString(36).substring(7),
          type: '4_STAR',
          itemKey,
          isFeatured: win5050,
        });

        pity4 = 0;
        guaranteed4 = !win5050;
        continue;
      }

      // Otherwise, it's a 3-star weapon
      pulls.push({
        id: Math.random().toString(36).substring(7),
        type: '3_STAR',
        itemKey: WEAPONS_3_STAR[Math.floor(Math.random() * WEAPONS_3_STAR.length)],
        isFeatured: false,
      });
    }

    return {
      pulls,
      endPity5: pity5,
      endPity4: pity4,
      endGuaranteed5: guaranteed5,
      endGuaranteed4: guaranteed4,
    };
  }
}

export const pullSimulatorService = new PullSimulatorService();
