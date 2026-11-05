/* global document */
import { createRequire } from 'node:module';

import {
  characterReadinessRequestSchema,
  defaultTeamSearchPreferences,
  teamSearchPreferencesSchema,
} from '@celestia/api-contracts';
import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextualReadinessBadge } from '../../web/src/components/ContextualReadinessBadge.tsx';
import { MarginalUpgradeCard } from '../../web/src/components/MarginalUpgradeCard.tsx';
import { ReadinessDimensionsList } from '../../web/src/components/ReadinessDimensionsList.tsx';
import {
  parseTeamPreferences,
  readTeamPreferencesRaw,
  writeTeamPreferences,
} from '../../web/src/lib/team-preferences.ts';
import {
  characterToReadinessInput,
  marginalInvestmentQueryKey,
  readinessQueryKey,
} from '../../web/src/lib/use-character-readiness.ts';
import { useAuthStore } from '../../web/src/stores/auth.store.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h, act } = require('react');
const { createRoot } = require('react-dom/client');

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000/' });
function installDom() {
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Event']) {
    vi.stubGlobal(name, dom.window[name]);
  }
}

let root;

beforeAll(() => {
  installDom();
});

beforeEach(() => {
  installDom();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
});

afterEach(async () => {
  await act(async () => {
    if (root) root.unmount();
  });
  vi.unstubAllGlobals();
});

afterAll(() => {
  dom.window.close();
});

function storage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

describe('ContextualReadinessBadge', () => {
  it('renders correct labels and scores for all 4 readiness states', async () => {
    // 1. ready_for_target
    await act(async () => {
      root.render(h(ContextualReadinessBadge, { status: 'ready_for_target', score: 92 }));
    });
    expect(document.body.textContent).toContain('Ready for Target');
    expect(document.body.textContent).toContain('92');

    // 2. needs_investment
    await act(async () => {
      root.render(h(ContextualReadinessBadge, { status: 'needs_investment', score: 45 }));
    });
    expect(document.body.textContent).toContain('Needs Investment');
    expect(document.body.textContent).toContain('45');

    // 3. conditional
    await act(async () => {
      root.render(h(ContextualReadinessBadge, { status: 'conditional', score: 72 }));
    });
    expect(document.body.textContent).toContain('Conditional');
    expect(document.body.textContent).toContain('72');

    // 4. insufficient_data
    await act(async () => {
      root.render(h(ContextualReadinessBadge, { status: 'insufficient_data', score: 0 }));
    });
    expect(document.body.textContent).toContain('Incomplete Data');
    expect(document.body.textContent).toContain('0');
  });

  it('renders Target Met · Maintained when marked as Good Enough', async () => {
    await act(async () => {
      root.render(
        h(ContextualReadinessBadge, {
          status: 'conditional',
          score: 75,
          isGoodEnough: true,
        }),
      );
    });
    expect(document.body.textContent).toContain('Target Met · Maintained');
    expect(document.body.textContent).toContain('75');
    const badge = document.querySelector('[role="status"]');
    expect(badge.getAttribute('title')).toContain('Marked as Good Enough');
  });
});

describe('ReadinessDimensionsList', () => {
  const sampleDimensions = {
    talents: {
      dimension: 'talents',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: {},
      missingReasons: [],
    },
    weapon: {
      dimension: 'weapon',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: {},
      missingReasons: [],
    },
    main_stats: {
      dimension: 'main_stats',
      status: 'conditional',
      score: 67,
      isReady: false,
      details: {},
      missingReasons: [],
    },
    set_activation: {
      dimension: 'set_activation',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: {},
      missingReasons: [],
    },
    rotation_energy: {
      dimension: 'rotation_energy',
      status: 'needs_investment',
      score: 40,
      isReady: false,
      details: {
        hasEnergyDeficit: true,
        deficitPp: 35,
        observedEr: 145,
        effectiveThreshold: 180,
      },
      missingReasons: [],
    },
    support_output: {
      dimension: 'support_output',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: {},
      missingReasons: [],
    },
  };

  it('renders all 6 dimensions and highlights ER deficit prominently', async () => {
    await act(async () => {
      root.render(
        h(ReadinessDimensionsList, {
          dimensions: sampleDimensions,
          explanations: [
            'Pyronado Lv. 8 meets off-field baseline.',
            'Energy recharge (145%) deficit gates rotation consistency.',
          ],
          defaultOpen: true,
        }),
      );
    });

    const bodyText = document.body.textContent;
    // Dimensions checklist
    expect(bodyText).toContain('Talent Levels');
    expect(bodyText).toContain('Weapon Level & Fit');
    expect(bodyText).toContain('Artifact Main Stats');
    expect(bodyText).toContain('Set Activation');
    expect(bodyText).toContain('Rotation Energy (ER)');
    expect(bodyText).toContain('Support Output & Scaling');

    // ER deficit alert
    const alert = document.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Energy Deficit Gating Build');
    expect(alert.textContent).toContain('145%');
    expect(alert.textContent).toContain('180%');

    // Diagnostic rationale
    expect(bodyText).toContain('Diagnostic Rationale');
    expect(bodyText).toContain('Energy recharge (145%) deficit gates rotation consistency.');
  });
});

describe('MarginalUpgradeCard', () => {
  const sampleUpgradeData = {
    currentReadiness: {
      status: 'needs_investment',
      score: 55,
      dimensions: {},
      missingData: [],
    },
    recommendedNextAction: {
      id: 'talent:burst:8',
      category: 'talent',
      target: 'Pyronado',
      currentLevel: 6,
      targetLevel: 8,
      costs: [
        { materialKey: 'mora', name: 'Mora', count: 300000 },
        { materialKey: 'guide_to_diligence', name: 'Guide to Diligence', count: 12 },
        { materialKey: 'dvalin_sigh', name: "Dvalin's Sigh", count: 2 },
      ],
      expectedScoreDelta: 14.5,
      closesGap: true,
      efficiencyScore: 0.085,
    },
    rankedUpgrades: [],
    explanations: ['Priority gap closure outranks crowning low-impact normal attacks.'],
  };

  it('renders #1 recommended next action with costs and gap closure badge', async () => {
    await act(async () => {
      root.render(h(MarginalUpgradeCard, { marginalData: sampleUpgradeData }));
    });

    const bodyText = document.body.textContent;
    expect(bodyText).toContain('Highest-Yield Next Upgrade');
    expect(bodyText).toContain('Pyronado');
    expect(bodyText).toContain('Lv. 6 → Lv. 8');
    expect(bodyText).toContain('+14.5 pts');
    expect(bodyText).toContain('Closes Target Gap');
    expect(bodyText).toContain('Mora');
    expect(bodyText).toMatch(/300[,.]000/);
    expect(bodyText).toContain('Guide to Diligence');
    expect(bodyText).toContain("Dvalin's Sigh");
  });

  it('displays diminishing returns when character is target ready', async () => {
    const readyData = {
      ...sampleUpgradeData,
      currentReadiness: {
        status: 'ready_for_target',
        score: 95,
        dimensions: {},
        missingData: [],
      },
      recommendedNextAction: null,
      rankedUpgrades: [],
    };

    await act(async () => {
      root.render(h(MarginalUpgradeCard, { marginalData: readyData }));
    });

    expect(document.body.textContent).toContain('Target Met · Diminishing Returns');
    expect(document.body.textContent).toContain('low marginal DPS return');
  });

  it('suppresses urgent alerts when marked as Good Enough', async () => {
    await act(async () => {
      root.render(
        h(MarginalUpgradeCard, {
          marginalData: sampleUpgradeData,
          isGoodEnough: true,
        }),
      );
    });

    expect(document.body.textContent).toContain('Marked as Good Enough · Farming Muted');
  });
});

describe('use-character-readiness helpers & query keys', () => {
  const uid = '800000001';
  const fixture = analysisFixture(uid);
  const character = fixture.snapshot.characters[0];

  it('converts ShowcaseCharacter into valid CharacterReadinessRequestInput', () => {
    const input = characterToReadinessInput(character, {
      roleId: 'healing_support',
      encounterId: 'abyss_12',
      difficulty: 'abyss_12',
    });

    expect(input.character.characterKey).toBeTruthy();
    expect(input.roleProfile).toBe('healing_support');
    expect(input.targetEncounter).toMatchObject({
      encounterId: 'abyss_12',
      difficulty: 'abyss_12',
    });
    expect(input.character.level).toBeGreaterThanOrEqual(1);
    expect(input.character.artifacts).toHaveProperty('flower');
    expect(input.character.artifacts).toHaveProperty('sands');

    // Validates against API contract schema
    const parsed = characterReadinessRequestSchema.parse(input);
    expect(parsed.character.characterKey).toBe(input.character.characterKey);
  });

  it('preserves missing weapon and artifact levels as null without default numbers', () => {
    const rawChar = {
      ...character,
      level: null,
      ascension: null,
      weapon: {
        id: 11401,
        name: 'Favonius Sword',
        level: null,
        refinement: null,
      },
      artifacts: [
        {
          id: 75544,
          slot: 'flower',
          setName: 'Emblem of Severed Fate',
          level: null,
          rarity: null,
          mainStat: { id: 'hp', name: 'HP', value: 4780 },
        },
      ],
    };

    const input = characterToReadinessInput(rawChar);

    // Levels and ascension must remain null rather than defaulting to plausible numbers
    expect(input.character.level).toBeNull();
    expect(input.character.ascension).toBeNull();
    expect(input.character.weapon.level).toBeNull();
    expect(input.character.weapon.refinement).toBe(1);
    expect(input.character.artifacts.flower.level).toBeNull();
    expect(input.character.artifacts.flower.rarity).toBeNull();

    // Omitted artifact slots must remain null
    expect(input.character.artifacts.plume).toBeNull();
    expect(input.character.artifacts.sands).toBeNull();
    expect(input.character.artifacts.goblet).toBeNull();
    expect(input.character.artifacts.circlet).toBeNull();

    // Validates against contract schema without throwing
    const parsed = characterReadinessRequestSchema.parse(input);
    expect(parsed.character.level).toBeNull();
    expect(parsed.character.weapon.level).toBeNull();
  });

  it('generates consistent, deterministic query keys', () => {
    const key1 = readinessQueryKey('Xiangling', 'sig123', 'off_field_damage', 'abyss_12');
    const key2 = readinessQueryKey('Xiangling', 'sig123', 'off_field_damage', 'abyss_12');
    expect(key1).toEqual(key2);
    expect(key1).toEqual([
      'character-readiness',
      'Xiangling',
      'sig123',
      'off_field_damage',
      'abyss_12',
    ]);

    const mKey = marginalInvestmentQueryKey('Furina', 'sig456', 'party_buff', 'training_dummy');
    expect(mKey).toEqual([
      'marginal-investment',
      'Furina',
      'sig456',
      'party_buff',
      'training_dummy',
    ]);
  });
});

describe('Preferences Good Enough Stop Condition', () => {
  const uid = '800000001';
  const furina = 'avatar:10000089';
  const xiangling = 'avatar:10000023';

  it('parses and persists goodEnoughCharacters correctly', () => {
    const target = storage();
    const base = defaultTeamSearchPreferences(uid);
    expect(base.goodEnoughCharacters).toEqual([]);

    const preferences = {
      ...base,
      goodEnoughCharacters: [furina, xiangling],
    };

    // Validates with schema
    const parsed = teamSearchPreferencesSchema.parse(preferences);
    expect(parsed.goodEnoughCharacters).toEqual([furina, xiangling]);

    // Saves and roundtrips
    writeTeamPreferences(uid, preferences, null, target);
    const retrieved = parseTeamPreferences(uid, readTeamPreferencesRaw(uid, target));
    expect(retrieved.state).toBe('saved');
    expect(retrieved.preferences.goodEnoughCharacters).toEqual([furina, xiangling]);
  });

  it('rejects duplicate character identities in goodEnoughCharacters', () => {
    const base = defaultTeamSearchPreferences(uid);
    const withDuplicates = {
      ...base,
      goodEnoughCharacters: [furina, furina],
    };
    expect(teamSearchPreferencesSchema.safeParse(withDuplicates).success).toBe(false);
  });
});

describe('Public Unauthenticated vs Authenticated Rendering Integration', () => {
  const sampleReadinessData = {
    status: 'ready_for_target',
    score: 90,
    dimensions: {
      talents: {
        dimension: 'talents',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: {},
        missingReasons: [],
      },
      weapon: {
        dimension: 'weapon',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: {},
        missingReasons: [],
      },
      main_stats: {
        dimension: 'main_stats',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: {},
        missingReasons: [],
      },
      set_activation: {
        dimension: 'set_activation',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: {},
        missingReasons: [],
      },
      rotation_energy: {
        dimension: 'rotation_energy',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: {},
        missingReasons: [],
      },
      support_output: {
        dimension: 'support_output',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: {},
        missingReasons: [],
      },
    },
    explanations: ['Build meets all benchmarks.'],
    missingData: [],
  };

  const sampleMarginalData = {
    currentReadiness: sampleReadinessData,
    recommendedNextAction: null,
    rankedUpgrades: [],
    explanations: ['All dimensions met.'],
  };

  it('renders readiness components cleanly for anonymous public visitors without throwing', async () => {
    // Ensure auth store is unauthenticated
    useAuthStore.setState({ isAuthenticated: false, user: null, token: null });

    await act(async () => {
      root.render(
        h(
          'div',
          null,
          h(ContextualReadinessBadge, {
            status: sampleReadinessData.status,
            score: sampleReadinessData.score,
          }),
          h(ReadinessDimensionsList, {
            dimensions: sampleReadinessData.dimensions,
            explanations: sampleReadinessData.explanations,
            defaultOpen: true,
          }),
          h(MarginalUpgradeCard, { marginalData: sampleMarginalData }),
        ),
      );
    });

    expect(document.body.textContent).toContain('Ready for Target');
    expect(document.body.textContent).toContain('90');
    expect(document.body.textContent).toContain('Talent Levels');
    expect(document.body.textContent).toContain('Target Met · Diminishing Returns');
  });

  it('renders readiness components and supports server-backed preferences for authenticated imported accounts', async () => {
    // Ensure auth store is authenticated
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'usr_import_123', email: 'owner@example.com' },
      token: 'jwt_mock_token',
    });

    await act(async () => {
      root.render(
        h(
          'div',
          null,
          h(ContextualReadinessBadge, {
            status: sampleReadinessData.status,
            score: sampleReadinessData.score,
            isGoodEnough: true,
          }),
          h(ReadinessDimensionsList, {
            dimensions: sampleReadinessData.dimensions,
            explanations: sampleReadinessData.explanations,
          }),
          h(MarginalUpgradeCard, {
            marginalData: sampleMarginalData,
            isGoodEnough: true,
          }),
        ),
      );
    });

    expect(document.body.textContent).toContain('Target Met · Maintained');
    expect(document.body.textContent).toContain('Marked as Good Enough · Farming Muted');
  });
});
