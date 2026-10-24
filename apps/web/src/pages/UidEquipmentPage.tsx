import { Link, useSearchParams } from 'react-router-dom';

import { AccessibleTabs, TabPanel } from '../components/AccessibleTabs';
import { Equipment } from '../components/ShowcaseSnapshot';
import { PageHeader } from '../components/Ui';
import UidShowcaseToolbar from '../components/UidShowcaseToolbar';
import { uidCharacterPath, useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

export default function UidEquipmentPage() {
  const { uid, query } = useUidWorkspace();
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') === 'artifacts' ? 'artifacts' : 'weapons';
  const history = useObservedRoster(uid, query.data);
  const current = new Set(
    (query.data?.snapshot?.characters ?? []).map((character) => character.key),
  );
  const weapons = history.records.flatMap(({ character, observedAt }) =>
    character.weapon ? [{ character, observedAt, item: character.weapon }] : [],
  );
  const artifacts = history.records.flatMap(({ character, observedAt }) =>
    character.artifacts.map((item) => ({ character, observedAt, item })),
  );
  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-7">
      <PageHeader
        eyebrow="YOUR EQUIPMENT"
        title="Equipped weapons & artifacts"
        description="Latest observed equipment in this browser's roster. Retained builds may differ from the current showcase. Unequipped inventory and materials are not provided by a UID lookup."
      />
      <UidShowcaseToolbar />
      {history.issue ? (
        <p role="alert" className="text-sm text-amber-100">
          {history.issue}
        </p>
      ) : null}
      <AccessibleTabs
        label="Equipment sections"
        prefix="uid-equipment"
        active={active}
        tabs={[
          { id: 'weapons', label: `Weapons (${weapons.length})` },
          { id: 'artifacts', label: `Artifacts (${artifacts.length})` },
        ]}
        onChange={(value) => {
          const next = new URLSearchParams(params);
          next.set('tab', value);
          setParams(next);
        }}
      />
      {(['weapons', 'artifacts'] as const).map((tab) => (
        <TabPanel key={tab} id={tab} active={active} prefix="uid-equipment">
          <div className="grid gap-4 lg:grid-cols-2">
            {(tab === 'weapons' ? weapons : artifacts).map(
              ({ character, observedAt, item }, index) => (
                <div
                  key={`${character.key}:${item.slot ?? 'weapon'}:${index}`}
                  className="min-w-0 space-y-2"
                >
                  <Link
                    to={uidCharacterPath(uid, character.key)}
                    className="text-sm text-amber-100 underline"
                  >
                    Equipped by {character.name}
                  </Link>
                  {!current.has(character.key) ? (
                    <p className="text-xs text-zinc-400">
                      Previously observed · not in the current showcase. Last seen{' '}
                      <time dateTime={observedAt}>{new Date(observedAt).toLocaleString()}</time>.
                    </p>
                  ) : null}
                  <Equipment item={item} />
                </div>
              ),
            )}
          </div>
          {query.data?.snapshot && !(tab === 'weapons' ? weapons : artifacts).length ? (
            <p role="status" className="glass-panel rounded-xl p-5">
              No equipped {tab} were reported in this public showcase.
            </p>
          ) : null}
        </TabPanel>
      ))}
    </main>
  );
}
