import { createRequire } from 'node:module';

import { expect, it } from 'vitest';

import { summarizeRuns } from '../../web/src/lib/team-damage/calculator.ts';
import { rotationExecution } from '../../web/src/lib/team-damage/execution.calculator.ts';
import { explainRotationExecution } from '../../web/src/lib/team-damage/explainer.ts';
import { summaryRun } from './rotation-execution-fixtures.mjs';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const burst = [
  { characterKey: '10000032:3201', action: 'burst', repeat: 1, params: '', waitFrames: 0 },
];

it('flags observed energy blocks without turning cooldown checks into energy problems', () => {
  const run = summaryRun();
  const clear = rotationExecution(summarizeRuns([run]), burst)[0];
  expect(clear).toMatchObject({
    state: 'no_energy_block_observed',
    burstCount: 1,
    energyChecks: 0,
    cooldownChecks: 120,
  });
  expect(explainRotationExecution(clear).join(' ')).not.toMatch(/more Energy Recharge|farm/i);
  run.members[0].blockedAttempts.insufficient_energy = 60;
  const limited = rotationExecution(summarizeRuns([run]), burst)[0];
  expect(limited).toMatchObject({ state: 'energy_blocked', energyChecks: 60, cooldownChecks: 120 });
  expect(explainRotationExecution(limited).join(' ')).toMatch(/particle|energy/i);
});

it('keeps unrequested, unexecuted and unmeasured Bursts distinct', () => {
  const run = summaryRun();
  expect(rotationExecution(summarizeRuns([run]), [])[0].state).toBe('burst_not_tested');
  run.members[0].actions = 2;
  delete run.members[0].actionCounts.burst;
  expect(rotationExecution(summarizeRuns([run]), burst)[0].state).toBe('burst_not_executed');
  const legacy = rotationExecution(summarizeRuns([summaryRun(false)]), burst)[0];
  expect(legacy).toMatchObject({
    state: 'unknown',
    energyChecks: null,
    cooldownChecks: null,
    burstCount: null,
  });
  expect(explainRotationExecution(legacy).join(' ')).toMatch(/unavailable/i);
});

it('keeps retry counts as checks and does not present no observed block as sustained readiness', () => {
  const run = summaryRun();
  run.members[0].blockedAttempts.insufficient_stamina = 12;
  const result = rotationExecution(summarizeRuns([run]), burst)[0];
  expect(result.otherChecks).toBe(12);
  const text = explainRotationExecution(result).join(' ');
  expect(text).toMatch(/starting energy/i);
  expect(text).toMatch(/checks/i);
  expect(text).not.toMatch(/120 seconds|12 seconds|energy.ready/i);
});

it('renders names and distinct energy evidence in the saved-team result disclosure', async () => {
  const { default: RotationExecutionEvidence } =
    await import('../../web/src/components/RotationExecutionEvidence.tsx');
  const run = summaryRun();
  run.members[0].blockedAttempts.insufficient_energy = 60;
  const html = renderToStaticMarkup(
    h(RotationExecutionEvidence, {
      result: summarizeRuns([run]),
      steps: burst,
      names: { bennett: 'Bennett' },
    }),
  );
  expect(html).toContain('Bennett');
  expect(html).toContain('Energy blocked');
  expect(html).toContain('Cooldown');
  expect(html).toMatch(/retry checks/);
  expect(html).not.toContain('undefined');
});
