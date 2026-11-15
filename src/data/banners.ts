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
  weaponBanner: {
    featuredWeapons: string[];
  };
}

export const BANNER_PHASES: BannerPhase[] = [
  {
    id: 'banner_5_3_phase_1',
    version: '5.3',
    phaseName: '5.3 Phase 1: Ignition & Starlight',
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
    phaseName: '5.3 Phase 2: Moonlit Retribution',
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
    id: 'banner_5_2_phase_2',
    version: '5.2',
    phaseName: '5.2 Phase 2: Bedrock & Inexorable Tides',
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
    phaseName: '5.2 Phase 1: Wings Across Plumes',
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
    id: 'banner_5_1_phase_1',
    version: '5.1',
    phaseName: '5.1 Phase 1: Song of Rolling Rocks',
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
  {
    id: 'banner_5_1_phase_2',
    version: '5.1',
    phaseName: '5.1 Phase 2: Wisdom & Butterfly Dreams',
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
    id: 'banner_5_4_phase_1',
    version: '5.4',
    phaseName: '5.4 Phase 1: Nod-Krai Premiere',
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
];
