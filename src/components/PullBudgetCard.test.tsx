import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PullBudgetCard, calculateTotalPulls } from './PullBudgetCard';
import type { PullBudgetState } from '../types/genshin';

describe('PullBudgetCard Component', () => {
  const mockBudget: PullBudgetState = {
    primogems: 16000,
    fates: 20,
    characterPity: 45,
    characterGuaranteed: true,
    weaponPity: 25,
    weaponFatePoints: 1,
  };

  it('calculates total pulls correctly from primogems and fates', () => {
    // 16,000 / 160 = 100 pulls + 20 fates = 120 total pulls
    expect(calculateTotalPulls(16000, 20)).toBe(120);

    // Floor partial primogems
    expect(calculateTotalPulls(159, 10)).toBe(10);
    expect(calculateTotalPulls(320, 0)).toBe(2);
    expect(calculateTotalPulls(0, 0)).toBe(0);
  });

  it('renders budget numbers, total pulls, and pity values to HTML', () => {
    const html = renderToString(
      <PullBudgetCard budget={mockBudget} onChangeBudget={() => {}} />
    );

    expect(html).toContain('120'); // Total pulls badge
    expect(html).toContain('16000'); // Primogems input value
    expect(html).toContain('20'); // Fates
    expect(html).toContain('45'); // Character pity
    expect(html).toContain('25'); // Weapon pity
    expect(html).toContain('Guaranteed'); // 50/50 guaranteed active
    expect(html).toContain('Fate Point'); // Fate points
  });

  it('renders quick-add buttons (+10, +50, +100)', () => {
    const html = renderToString(
      <PullBudgetCard budget={mockBudget} onChangeBudget={() => {}} />
    );

    expect(html).toContain('+10');
    expect(html).toContain('+50');
    expect(html).toContain('+100');
  });

  it('displays non-guaranteed 50/50 status when characterGuaranteed is false', () => {
    const nonGuaranteedBudget: PullBudgetState = {
      ...mockBudget,
      characterGuaranteed: false,
      weaponFatePoints: 0,
    };
    const html = renderToString(
      <PullBudgetCard budget={nonGuaranteedBudget} onChangeBudget={() => {}} />
    );

    expect(html).toContain('50/50');
  });
});
