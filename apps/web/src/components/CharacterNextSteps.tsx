import type { CharacterEquipmentResponse, GoalRecord } from '@celestia/api-contracts';
import { Link } from 'react-router-dom';

import { artworkDisplayName } from '../lib/artwork';

export function CharacterNextSteps({
  data,
  goals,
}: {
  data: CharacterEquipmentResponse;
  goals?: GoalRecord[];
}) {
  const key = data.character.characterKey;
  const weapon = data.weapon.item?.weaponKey;
  const chosen = goals
    ?.filter(
      (g) =>
        g.status === 'active' &&
        (g.targetKey === key || (g.goalType === 'WEAPON_ASCENSION' && g.targetKey === weapon)),
    )
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3);
  return (
    <section aria-label="Character next steps" className="glass-panel mb-6 rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white">Your next step</h2>
      {chosen?.length ? (
        <ol className="mt-4 space-y-4">
          {chosen.map((goal) => (
            <li key={goal.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">
                  {goal.goalType === 'WEAPON_ASCENSION'
                    ? artworkDisplayName(goal.targetKey) + ' ascension'
                    : goal.goalType === 'CHARACTER_ASCENSION'
                      ? 'Character ascension'
                      : `${goal.talentType === 'normal' ? 'Normal Attack' : goal.talentType === 'skill' ? 'Skill' : 'Burst'} base talent`}{' '}
                  · {goal.fromPhase} → {goal.toPhase}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Your priority {goal.priority}.
                  {goal.needsReview
                    ? ' Review this goal before spending materials.'
                    : ' Check the materials for your chosen target.'}
                </p>
              </div>
              <Link
                className="button-secondary"
                to={`/planner?tab=farming&goal=${encodeURIComponent(goal.id)}`}
              >
                Open goal →
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-400">
            Choose an upgrade target to get a focused material plan. Talent goals use base levels;
            HoYoLAB’s displayed bonuses are kept separate.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="button-secondary"
              to={`/planner?tab=farming&newType=CHARACTER_TALENT&key=${encodeURIComponent(key)}`}
            >
              Plan a talent upgrade
            </Link>
            <Link
              className="button-secondary"
              to={`/planner?tab=farming&newType=CHARACTER_ASCENSION&key=${encodeURIComponent(key)}`}
            >
              Plan ascension
            </Link>
            {weapon && (
              <Link
                className="button-secondary"
                to={`/planner?tab=farming&newType=WEAPON_ASCENSION&key=${encodeURIComponent(weapon)}`}
              >
                Plan weapon ascension
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}
