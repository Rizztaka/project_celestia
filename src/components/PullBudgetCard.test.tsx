import { describe, it, expect, vi } from 'vitest';
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

  it('displays non-guaranteed 50/50 status and Capturing Radiance stepper when characterGuaranteed is false', () => {
    const nonGuaranteedBudget: PullBudgetState = {
      ...mockBudget,
      characterGuaranteed: false,
      consecutiveLossCount: 1,
      weaponFatePoints: 0,
    };
    const html = renderToString(
      <PullBudgetCard budget={nonGuaranteedBudget} onChangeBudget={() => {}} />
    );

    expect(html).toContain('50/50');
    expect(html).toContain('Radiance Streak:');
    expect(html).toContain('loss');
    expect(html).toContain('title="Decrease consecutive loss count"');
    expect(html).toContain('title="Increase consecutive loss count"');
  });

  it('renders numeric pity inputs alongside sliders for exact input entry', () => {
    const html = renderToString(
      <PullBudgetCard budget={mockBudget} onChangeBudget={() => {}} />
    );

    // Number inputs for pity values
    expect(html).toContain('value="45"');
    expect(html).toContain('value="25"');
    expect(html).toContain('/ 90');
    expect(html).toContain('/ 80');
  });

  it('renders weapon 75/25 off-banner guarantee carryover checkbox when not at max Fate Points', () => {
    const weaponNoFateBudget: PullBudgetState = {
      ...mockBudget,
      weaponFatePoints: 0,
      weaponGuaranteed: true,
    };
    const html = renderToString(
      <PullBudgetCard budget={weaponNoFateBudget} onChangeBudget={() => {}} />
    );

    expect(html).toContain('75/25 Off-Banner Guar.');
    expect(html).toContain('checked=""');
  });

  it('renders Chronicled Wish column with pity counter and 1 Fate Point toggle', () => {
    const chronicledBudget: PullBudgetState = {
      ...mockBudget,
      chronicledPity: 35,
      chronicledFatePoints: 1,
    };
    const html = renderToString(
      <PullBudgetCard budget={chronicledBudget} onChangeBudget={() => {}} />
    );

    expect(html).toContain('Chronicled Wish');
    expect(html).toContain('value="35"');
    expect(html).toContain('1 Fate Point (Guaranteed)');
    expect(html).toContain('Pity carries over between events; Fate Points reset to 0.');
  });

  it('factors in Starglitter Cashback (+~8%) and renders bonus cashback badge when enabled', () => {
    const cashbackBudget: PullBudgetState = {
      primogems: 16000, // 100 pulls
      fates: 0,
      characterPity: 0,
      characterGuaranteed: false,
      weaponPity: 0,
      weaponFatePoints: 0,
      includeCashback: true,
    };
    const html = renderToString(
      <PullBudgetCard budget={cashbackBudget} onChangeBudget={() => {}} />
    );

    // 100 pulls * 1.08 = 108 effective pulls (+8 bonus)
    expect(html).toContain('108');
    expect(html).toContain('+8 cashback');
    expect(html).toContain('Factor in ~8% Cashback');
  });

  it('renders Assumptions & Rules button when onOpenAssumptions is provided', () => {
    const handleOpenAssumptions = vi.fn();
    const html = renderToString(
      <PullBudgetCard
        budget={mockBudget}
        onChangeBudget={() => {}}
        onOpenAssumptions={handleOpenAssumptions}
      />
    );

    expect(html).toContain('(Assumptions &amp; Rules)');
  });
});
