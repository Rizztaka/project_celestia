import { describe, expect, it } from 'vitest';
import { pullSimulatorService } from './pull-simulator.service.js';

describe('Pull Simulator Service', () => {
  it('should guarantee a 5-star at 90 pity', () => {
    const result = pullSimulatorService.simulatePulls({
      bannerId: 'banner_odette_phase1',
      count: 1,
      currentPity5: 89,
      currentPity4: 0,
      guaranteed5: false,
      guaranteed4: false,
    });

    expect(result.pulls.length).toBe(1);
    expect(result.pulls[0].type).toBe('5_STAR');
    expect(result.endPity5).toBe(0);
  });

  it('should guarantee a 4-star at 10 pity', () => {
    const result = pullSimulatorService.simulatePulls({
      bannerId: 'banner_odette_phase1',
      count: 1,
      currentPity5: 0,
      currentPity4: 9,
      guaranteed5: false,
      guaranteed4: false,
    });

    expect(result.pulls.length).toBe(1);
    // Even if we hit a 5-star early, the test just checks the mechanism.
    // If it's a 5-star, 4-star pity isn't reset in our logic unless we hit 4-star.
    // But at 10 pity, it MUST be a 4-star if it isn't a 5-star.
    if (result.pulls[0].type !== '5_STAR') {
      expect(result.pulls[0].type).toBe('4_STAR');
      expect(result.endPity4).toBe(0);
    }
  });

  it('should guarantee the featured 5-star when guaranteed5 is true', () => {
    const result = pullSimulatorService.simulatePulls({
      bannerId: 'banner_odette_phase1',
      count: 1,
      currentPity5: 89,
      currentPity4: 0,
      guaranteed5: true,
      guaranteed4: false,
    });

    expect(result.pulls[0].type).toBe('5_STAR');
    expect(result.pulls[0].itemKey).toBe('Odette');
    expect(result.pulls[0].isFeatured).toBe(true);
    expect(result.endGuaranteed5).toBe(false);
  });

  it('large scale test: 5-star rate should approach ~1.6%', () => {
    const totalPulls = 100000;
    let fiveStarCount = 0;

    let pity5 = 0;
    let pity4 = 0;
    let g5 = false;
    let g4 = false;

    // Simulate batch pulls by calling the service iteratively 100x1000
    for (let i = 0; i < totalPulls / 100; i++) {
      const res = pullSimulatorService.simulatePulls({
        bannerId: 'banner_odette_phase1',
        count: 100,
        currentPity5: pity5,
        currentPity4: pity4,
        guaranteed5: g5,
        guaranteed4: g4,
      });

      pity5 = res.endPity5;
      pity4 = res.endPity4;
      g5 = res.endGuaranteed5;
      g4 = res.endGuaranteed4;

      fiveStarCount += res.pulls.filter((p) => p.type === '5_STAR').length;
    }

    const rate = fiveStarCount / totalPulls;
    // The consolidated rate in Genshin Impact is ~1.6%
    // Allowing a small variance (1.4% to 1.8%)
    expect(rate).toBeGreaterThan(0.014);
    expect(rate).toBeLessThan(0.018);
  });
});
