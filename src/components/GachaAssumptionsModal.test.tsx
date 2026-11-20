import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { GachaAssumptionsModal } from './GachaAssumptionsModal';
import { GACHA_RULES_VERSION } from '../data/banner-rules';

describe('GachaAssumptionsModal Component', () => {
  it('renders null when isOpen is false', () => {
    const html = renderToString(
      <GachaAssumptionsModal isOpen={false} onClose={() => {}} />
    );
    expect(html).toBe('');
  });

  it('renders full methodology and transparent formulas when isOpen is true', () => {
    const html = renderToString(
      <GachaAssumptionsModal isOpen={true} onClose={() => {}} />
    );

    // Title & Version baseline
    expect(html).toContain('Gacha Mathematics &amp; Wish Engine Methodology');
    expect(html).toContain(`Version ${GACHA_RULES_VERSION} Baseline`);

    // Section 1: Character Event Wish & 4-State Capturing Radiance
    expect(html).toContain('1. Character Event Wish: 4-State Capturing Radiance');
    expect(html).toContain('55.000%');
    expect(html).toContain('Streak 0:');
    expect(html).toContain('Streak 1:');
    expect(html).toContain('Streak 2:');
    expect(html).toContain('8/11 (~72.73%)');
    expect(html).toContain('Streak 3+:');
    expect(html).toContain('100.0% (Guaranteed)');
    expect(html).toContain('π = [11/20, 11/40, 11/80, 3/80]');

    // Section 2: Weapon Banner 75/25 Carryover & 1 Fate Point Ceiling
    expect(html).toContain('2. Weapon Event Wish: 1 Fate Point &amp; 75/25 Off-Banner Carryover');
    expect(html).toContain('37.5% target win rate');
    expect(html).toContain('50.0% target win rate');
    expect(html).toContain('75/25 off-banner guarantee carries over indefinitely');

    // Section 3: Chronicled Wish Rules
    expect(html).toContain('3. Chronicled Wish Rules');
    expect(html).toContain('Capturing Radiance does not apply to Chronicled Wish');

    // Section 4: Featured 4-Star Targets
    expect(html).toContain('4. Featured 4-Star Targets');
    expect(html).toContain('no hard ceiling or Fate Point');
    expect(html).toContain('~35 pulls');

    // Section 5: Starglitter Cashback Projection
    expect(html).toContain('5. Masterless Starglitter Cashback Projection');
    expect(html).toContain('~8%');

    // Primary Source Citations
    expect(html).toContain('https://genshin.hoyoverse.com/en/news/detail/125274');
    expect(html).toContain('Authoritative Sources: HoYoverse Disclosures');
  });
});
