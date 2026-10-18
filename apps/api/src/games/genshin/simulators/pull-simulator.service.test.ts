import { describe, expect, it } from 'vitest';

import { PullSimulatorService } from './pull-simulator.service.js';
const base = {
  bannerId: 'banner_mavuika_phase1',
  count: 1,
  currentPity5: 0,
  currentPity4: 0,
  guaranteed5: false,
  guaranteed4: false,
};
function stream(...values: number[]) {
  let i = 0;
  return () => values[i++] ?? 0.99;
}
describe('Wish simulator state transitions', () => {
  it('guarantees character 5-star at 90 and sets the featured guarantee after a loss', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls({
      ...base,
      currentPity5: 89,
    });
    expect(result.pulls[0]).toMatchObject({
      type: '5_STAR',
      itemKind: 'character',
      isFeatured: false,
    });
    expect(result.endPity5).toBe(0);
    expect(result.endGuaranteed5).toBe(true);
    expect(result.endPity4).toBe(1);
  });
  it('consumes the character featured guarantee', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls({
      ...base,
      currentPity5: 89,
      guaranteed5: true,
    });
    expect(result.pulls[0].itemKey).toBe('Mavuika');
    expect(result.endGuaranteed5).toBe(false);
  });
  it('guarantees a 4-star after 10 non-5-star pulls and maintains independent pity', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls({ ...base, currentPity4: 9 });
    expect(result.pulls[0].type).toBe('4_STAR');
    expect(result.endPity4).toBe(0);
    expect(result.endPity5).toBe(1);
  });
  it('resolves a held 4-star guarantee after a 5-star takes precedence', () => {
    const service = new PullSimulatorService(() => 0.99);
    const first = service.simulatePulls({
      ...base,
      currentPity5: 89,
      currentPity4: 9,
      guaranteed4: true,
    });
    expect(first.endPity4).toBe(10);
    expect(first.endGuaranteed4).toBe(true);
    const second = service.simulatePulls({
      ...base,
      currentPity4: first.endPity4,
      guaranteed4: first.endGuaranteed4,
    });
    expect(second.pulls[0].isFeatured).toBe(true);
    expect(second.endPity4).toBe(0);
  });
  it('returns canonical keys and weapon artwork kinds for 3-stars', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls(base);
    expect(result.pulls[0]).toMatchObject({
      type: '3_STAR',
      itemKind: 'weapon',
      itemKey: 'SkyriderSword',
    });
    expect(result.pulls[0].id).toMatch(/^[a-f0-9-]{36}$/);
  });
  it('weapon 80 pity awards one Fate Point for the other promotional weapon', () => {
    const result = new PullSimulatorService(stream(0.99, 0.2, 0.99)).simulatePulls({
      ...base,
      bannerId: 'weapon_53_phase1',
      currentPity5: 79,
      pathTargetKey: 'AThousandBlazingSuns',
    });
    expect(result.pulls[0]).toMatchObject({
      itemKey: 'StarcallersWatch',
      itemKind: 'weapon',
      isFeatured: true,
    });
    expect(result.endFatePoints).toBe(1);
    expect(result.endGuaranteed5).toBe(false);
  });
  it('one weapon Fate Point overrides 75/25 and guarantees the target, then clears', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls({
      ...base,
      bannerId: 'weapon_53_phase1',
      currentPity5: 79,
      pathTargetKey: 'AThousandBlazingSuns',
      fatePoints: 1,
    });
    expect(result.pulls[0].itemKey).toBe('AThousandBlazingSuns');
    expect(result.endFatePoints).toBe(0);
  });
  it('a standard weapon loss sets both promotional guarantee and one Fate Point', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls({
      ...base,
      bannerId: 'weapon_53_phase1',
      currentPity5: 79,
      pathTargetKey: 'AThousandBlazingSuns',
    });
    expect(result.pulls[0].isFeatured).toBe(false);
    expect(result.endGuaranteed5).toBe(true);
    expect(result.endFatePoints).toBe(1);
  });
  it('weapons guarantee a 4-star at 9 non-5-star pulls', () => {
    const result = new PullSimulatorService(() => 0.99).simulatePulls({
      ...base,
      bannerId: 'weapon_53_phase1',
      currentPity4: 8,
      pathTargetKey: 'StarcallersWatch',
      guaranteed4: true,
    });
    expect(result.pulls[0]).toMatchObject({ type: '4_STAR', itemKind: 'weapon', isFeatured: true });
  });
  it('Chronicled losses stay within the regional character pool and award Fate', () => {
    const service = new PullSimulatorService(() => 0.99);
    const result = service.simulatePulls({
      ...base,
      bannerId: 'chronicled_mondstadt_45',
      currentPity5: 89,
      pathTargetKey: 'Eula',
    });
    expect(result.pulls[0]).toMatchObject({
      itemKey: 'Klee',
      itemKind: 'character',
      isFeatured: false,
    });
    expect(result.endFatePoints).toBe(1);
    const next = service.simulatePulls({
      ...base,
      bannerId: 'chronicled_mondstadt_45',
      currentPity5: 89,
      pathTargetKey: 'Eula',
      fatePoints: 1,
    });
    expect(next.pulls[0].itemKey).toBe('Eula');
    expect(next.endFatePoints).toBe(0);
  });
  it.each([0, -1, 101, 1.5, NaN])('rejects invalid pull count %s', (count) => {
    expect(() => new PullSimulatorService().simulatePulls({ ...base, count })).toThrow();
  });
  it('rejects unknown scenarios, impossible pity, and unlisted path targets', () => {
    const service = new PullSimulatorService();
    for (const input of [
      { bannerId: 'unknown' },
      { currentPity5: 90 },
      { fatePoints: 1 as const },
      { bannerId: 'weapon_53_phase1', currentPity5: 80, pathTargetKey: 'AThousandBlazingSuns' },
      { bannerId: 'weapon_53_phase1', pathTargetKey: 'StaffOfHoma' },
    ])
      expect(() => service.simulatePulls({ ...base, ...input })).toThrow();
  });
  it('provides historical scenarios with only actual 4-star promotional characters', () => {
    const banners = new PullSimulatorService().getBanners();
    expect(banners).toHaveLength(6);
    expect(banners.find((b) => b.fiveStarKey === 'Mavuika')?.fourStarKeys).toEqual([
      'Kachina',
      'Bennett',
      'Diona',
    ]);
    expect(
      banners.every((b) => b.historical && Date.parse(b.endDate) < Date.parse('2026-10-18')),
    ).toBe(true);
    expect(banners.find((b) => b.type === 'WEAPON')?.fatePointCap).toBe(1);
  });
});
