import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PullDistributionModal } from './PullDistributionModal';
import type { EnhancedPullAdvice, PullBudgetState } from '../types/genshin';
import { calculateCharacterBannerOdds, calculateMultiCopyOdds } from '../engines/gacha-math';
import { calculate4StarTargetOdds } from '../engines/gacha-4star';

describe('PullDistributionModal Component', () => {
  const baseBudget: PullBudgetState = {
    primogems: 16000,
    fates: 20,
    characterPity: 0,
    characterGuaranteed: false,
    weaponPity: 0,
    weaponFatePoints: 0,
  };

  const sampleCharacterAdvice: EnhancedPullAdvice = {
    id: 'char_c0_Mavuika',
    name: 'Mavuika',
    targetType: 'C0_Character',
    characterId: 'Mavuika',
    targetLevelText: 'C0 New Unlock',
    score: 95,
    tier: 'Must Pull',
    teamDamageUpliftPct: 32,
    unlockedArchetypes: ['Nightsoul Burst'],
    accountBenefits: ['Unrivaled off-field Pyro application.'],
    odds: calculateCharacterBannerOdds(120, 0, false, 0),
  };

  it('renders null when item is null', () => {
    const html = renderToString(
      <PullDistributionModal item={null} onClose={() => {}} budget={baseBudget} />
    );
    expect(html).toBe('');
  });

  it('renders title, character name, milestone statistics cards, and SVG curve', () => {
    const html = renderToString(
      <PullDistributionModal
        item={sampleCharacterAdvice}
        onClose={() => {}}
        budget={baseBudget}
        pullsAvailable={120}
      />
    );

    expect(html).toContain('Cumulative Wish Probability (CDF)');
    expect(html).toContain('Mavuika');
    expect(html).toContain('C0 New Unlock');
    expect(html).toContain('25th Percentile');
    expect(html).toContain('Median (50%)');
    expect(html).toContain('90th Percentile');
    expect(html).toContain('Hard Ceiling (100%)');
    expect(html).toContain('180 pulls');
    expect(html).toContain('<svg');
    expect(html).toContain('touch-none');
    expect(html).toContain('Probability vs Certainty:');
  });

  it('dynamically adapts CDF curve to user budget pity and guarantee state', () => {
    // Player has 70 pity and guaranteed 50/50 -> Hard guarantee is 90 - 70 = 20 pulls!
    const guaranteedBudget: PullBudgetState = {
      ...baseBudget,
      characterPity: 70,
      characterGuaranteed: true,
    };

    const guaranteedOdds = calculateCharacterBannerOdds(20, 70, true, 0);
    const guaranteedAdvice: EnhancedPullAdvice = {
      ...sampleCharacterAdvice,
      odds: guaranteedOdds,
    };

    const html = renderToString(
      <PullDistributionModal
        item={guaranteedAdvice}
        onClose={() => {}}
        budget={guaranteedBudget}
        pullsAvailable={20}
      />
    );

    // Hard ceiling must be 20 pulls
    expect(html).toContain('20 pulls');
    // At 20 pulls, probability is 100.0%
    expect(html).toContain('100.0%');
  });

  it('renders Uncapped badge and does not display false hard pity for featured 4-star targets', () => {
    const fourStarAdvice: EnhancedPullAdvice = {
      id: 'char_c0_Valeriy',
      name: 'Valeriy',
      targetType: 'C0_Character',
      characterId: 'Valeriy',
      targetLevelText: '4★ Featured Target',
      score: 75,
      tier: 'High Value',
      teamDamageUpliftPct: 15,
      unlockedArchetypes: [],
      accountBenefits: ['Versatile 4★ support.'],
      odds: calculate4StarTargetOdds(50, 0, false, 1, 'character'),
    };

    const html = renderToString(
      <PullDistributionModal
        item={fourStarAdvice}
        onClose={() => {}}
        budget={baseBudget}
        pullsAvailable={50}
      />
    );

    expect(html).toContain('Uncapped');
    expect(html).toContain('No hard guarantee');
    expect(html).toContain('Featured 4-star targets have <strong>no hard pity or Fate Point guarantee</strong>');
  });

  it('renders multi-copy cumulative milestone breakdown table for constellation goals', () => {
    const multiOdds = calculateMultiCopyOdds('character', 2, 100, 0, false, 0);
    const multiAdvice: EnhancedPullAdvice = {
      id: 'const_Furina_2',
      name: 'Furina C2',
      targetType: 'Constellation',
      characterId: 'Furina',
      targetLevelText: 'C2 Let Woman and Man Alike',
      score: 95,
      tier: 'Must Pull',
      teamDamageUpliftPct: 35,
      unlockedArchetypes: [],
      accountBenefits: ['Massive Fanfare accumulation rate.'],
      odds: multiOdds,
    };

    const html = renderToString(
      <PullDistributionModal
        item={multiAdvice}
        onClose={() => {}}
        budget={baseBudget}
        pullsAvailable={100}
      />
    );

    expect(html).toContain('Multi-Copy Cumulative Milestone Breakdown');
    expect(html).toContain('Copy 1');
    expect(html).toContain('Copy 2');
    expect(html).toContain('360p');
  });

  it('renders weapon banner specific parameters and 1 Fate Point guarantee ceiling', () => {
    const weaponAdvice: EnhancedPullAdvice = {
      id: 'weap_PeakPatrolSong',
      name: 'Peak Patrol Song',
      targetType: 'Signature_Weapon',
      characterId: 'Xilonen',
      weaponKey: 'PeakPatrolSong',
      targetLevelText: 'R1 Signature',
      score: 88,
      tier: 'High Value',
      teamDamageUpliftPct: 20,
      unlockedArchetypes: [],
      accountBenefits: ['Tailored best-in-slot.'],
      odds: calculateCharacterBannerOdds(80, 0, false, 0), // weapon odds format
    };

    const weaponBudget: PullBudgetState = {
      ...baseBudget,
      weaponPity: 50,
      weaponFatePoints: 1,
      weaponGuaranteed: false,
    };

    const html = renderToString(
      <PullDistributionModal
        item={weaponAdvice}
        onClose={() => {}}
        budget={weaponBudget}
        pullsAvailable={30}
      />
    );

    // With 50 pity and 1 Fate Point, max additional pulls is 80 - 50 = 30 pulls
    expect(html).toContain('Peak Patrol Song');
    expect(html).toContain('R1 Signature');
    expect(html).toContain('<svg');
  });
});
