export interface BannerPhase {
  id: string;
  version: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  characterBanners: Array<{
    characterId: string;
    signatureWeaponKey: string;
  }>;
  featured4StarIds?: string[];
  weaponBanner: {
    featuredWeapons: string[];
  };
}

export const BANNER_PHASES: BannerPhase[] = [
  {
    id: 'banner_7_2_phase_1',
    version: '7.2',
    phaseName: '7.2 P1: Mitya & Furina',
    startDate: '2026-11-04',
    endDate: '2026-11-24',
    characterBanners: [
      { characterId: 'Mitya', signatureWeaponKey: 'StarsealedEdict' },
      { characterId: 'Furina', signatureWeaponKey: 'SplendorOfTranquilWaters' },
    ],
    featured4StarIds: ['Valeriy'],
    weaponBanner: {
      featuredWeapons: ['StarsealedEdict', 'SplendorOfTranquilWaters'],
    },
  },
  {
    id: 'banner_7_2_phase_2',
    version: '7.2',
    phaseName: '7.2 P2: Zibai & Linnea',
    startDate: '2026-11-24',
    endDate: '2026-12-15',
    characterBanners: [
      { characterId: 'Zibai', signatureWeaponKey: 'LightOfFoliarIncision' },
      { characterId: 'Linnea', signatureWeaponKey: 'AquaSimulacra' },
    ],
    weaponBanner: {
      featuredWeapons: ['LightOfFoliarIncision', 'AquaSimulacra'],
    },
  },
  {
    id: 'banner_7_2_natlan_chronicled',
    version: '7.2',
    phaseName: '7.2 Natlan Chronicled Wish',
    startDate: '2026-11-24',
    endDate: '2026-12-15',
    characterBanners: [
      { characterId: 'Xilonen', signatureWeaponKey: 'PeakPatrolSong' },
      { characterId: 'Chasca', signatureWeaponKey: 'AstralVultureSCrimsonPlumage' },
      { characterId: 'Kinich', signatureWeaponKey: 'FangOfTheMountainKing' },
      { characterId: 'Mualani', signatureWeaponKey: 'SurfSUp' },
      { characterId: 'Varesa', signatureWeaponKey: 'VividNotions' },
    ],
    weaponBanner: {
      featuredWeapons: [
        'PeakPatrolSong',
        'AstralVultureSCrimsonPlumage',
        'FangOfTheMountainKing',
        'SurfSUp',
        'VividNotions',
      ],
    },
  },
  {
    id: 'banner_5_3_phase_1',
    version: '5.3',
    phaseName: '5.3 P1: Mavuika & Citlali',
    startDate: '2025-01-01',
    endDate: '2025-01-21',
    characterBanners: [
      { characterId: 'Mavuika', signatureWeaponKey: 'AThousandBlazingSuns' },
      { characterId: 'Citlali', signatureWeaponKey: 'StarcallerSWatch' },
    ],
    weaponBanner: {
      featuredWeapons: ['AThousandBlazingSuns', 'StarcallerSWatch'],
    },
  },
  {
    id: 'banner_5_3_phase_2',
    version: '5.3',
    phaseName: '5.3 P2: Arlecchino & Clorinde',
    startDate: '2025-01-21',
    endDate: '2025-02-11',
    characterBanners: [
      { characterId: 'Arlecchino', signatureWeaponKey: 'CrimsonMoonSSemblance' },
      { characterId: 'Clorinde', signatureWeaponKey: 'Absolution' },
    ],
    weaponBanner: {
      featuredWeapons: ['CrimsonMoonSSemblance', 'Absolution'],
    },
  },
  {
    id: 'banner_5_4_phase_1',
    version: '5.4',
    phaseName: '5.4 P1: Nefer & Furina',
    startDate: '2025-02-12',
    endDate: '2025-03-04',
    characterBanners: [
      { characterId: 'Nefer', signatureWeaponKey: 'ReliquaryOfTruth' },
      { characterId: 'Furina', signatureWeaponKey: 'SplendorOfTranquilWaters' },
    ],
    weaponBanner: {
      featuredWeapons: ['ReliquaryOfTruth', 'SplendorOfTranquilWaters'],
    },
  },
  {
    id: 'banner_5_2_phase_2',
    version: '5.2',
    phaseName: '5.2 P2: Neuvillette & Zhongli',
    startDate: '2024-12-10',
    endDate: '2024-12-31',
    characterBanners: [
      { characterId: 'Neuvillette', signatureWeaponKey: 'TomeOfTheEternalFlow' },
      { characterId: 'Zhongli', signatureWeaponKey: 'VortexVanquisher' },
    ],
    weaponBanner: {
      featuredWeapons: ['TomeOfTheEternalFlow', 'VortexVanquisher'],
    },
  },
  {
    id: 'banner_5_2_phase_1',
    version: '5.2',
    phaseName: '5.2 P1: Chasca & Lyney',
    startDate: '2024-11-20',
    endDate: '2024-12-10',
    characterBanners: [
      { characterId: 'Chasca', signatureWeaponKey: 'AstralVultureSCrimsonPlumage' },
      { characterId: 'Lyney', signatureWeaponKey: 'TheFirstGreatMagic' },
    ],
    weaponBanner: {
      featuredWeapons: ['AstralVultureSCrimsonPlumage', 'TheFirstGreatMagic'],
    },
  },
  {
    id: 'banner_5_1_phase_2',
    version: '5.1',
    phaseName: '5.1 P2: Nahida & Hu Tao',
    startDate: '2024-10-29',
    endDate: '2024-11-19',
    characterBanners: [
      { characterId: 'Nahida', signatureWeaponKey: 'AThousandFloatingDreams' },
      { characterId: 'HuTao', signatureWeaponKey: 'StaffOfHoma' },
    ],
    weaponBanner: {
      featuredWeapons: ['AThousandFloatingDreams', 'StaffOfHoma'],
    },
  },
  {
    id: 'banner_5_1_phase_1',
    version: '5.1',
    phaseName: '5.1 P1: Xilonen & Chiori',
    startDate: '2024-10-09',
    endDate: '2024-10-29',
    characterBanners: [
      { characterId: 'Xilonen', signatureWeaponKey: 'PeakPatrolSong' },
      { characterId: 'Chiori', signatureWeaponKey: 'UrakuMisugiri' },
    ],
    weaponBanner: {
      featuredWeapons: ['PeakPatrolSong', 'UrakuMisugiri'],
    },
  },
];
