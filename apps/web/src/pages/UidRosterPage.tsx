import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '../components/Ui';
import UidCharacterGrid from '../components/UidCharacterGrid';
import UidShowcaseToolbar from '../components/UidShowcaseToolbar';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

const elements = ['Anemo', 'Geo', 'Electro', 'Dendro', 'Hydro', 'Pyro', 'Cryo'];
const weapons = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];

export default function UidRosterPage() {
  const { uid, query } = useUidWorkspace();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const element = elements.includes(params.get('element') ?? '') ? params.get('element')! : '';
  const weapon = weapons.includes(params.get('weapon') ?? '') ? params.get('weapon')! : '';
  const rarity = ['4', '5'].includes(params.get('rarity') ?? '') ? params.get('rarity')! : '';
  const history = useObservedRoster(uid, query.data);
  const characters = history.records.map((record) => record.character);
  const current = new Set(
    (query.data?.snapshot?.characters ?? []).map((character) => character.key),
  );
  const visible = characters.filter(
    (character) =>
      `${character.name} ${character.id}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!element || character.element === element) &&
      (!weapon || character.weaponType === weapon) &&
      (!rarity || String(character.rarity) === rarity),
  );
  const filtered = !!(search || element || weapon || rarity);
  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-7">
      <PageHeader
        eyebrow="YOUR COLLECTION"
        title="Your characters"
        description={`Characters observed from UID ${uid}. Refresh adds and updates builds; previously seen characters stay in this browser's roster. This is not a complete private roster.`}
      />
      <UidShowcaseToolbar />
      {history.issue ? (
        <p role="alert" className="text-sm text-amber-100">
          {history.issue}
        </p>
      ) : null}
      <div
        className="collection-toolbar uid-roster-filters"
        role="group"
        aria-label="Character filters"
      >
        <label className="uid-roster-search block text-sm">
          Search characters
          <input
            aria-label="Search characters"
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2"
            type="search"
            value={search}
            onChange={(event) => updateFilter('q', event.target.value)}
          />
        </label>
        <label>
          Element
          <select
            aria-label="Element"
            value={element}
            onChange={(event) => updateFilter('element', event.target.value)}
          >
            <option value="">All elements</option>
            {elements.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Weapon type
          <select
            aria-label="Weapon type"
            value={weapon}
            onChange={(event) => updateFilter('weapon', event.target.value)}
          >
            <option value="">All weapon types</option>
            {weapons.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Character rarity
          <select
            aria-label="Character rarity"
            value={rarity}
            onChange={(event) => updateFilter('rarity', event.target.value)}
          >
            <option value="">All rarities</option>
            <option value="4">4★ characters</option>
            <option value="5">5★ characters</option>
          </select>
        </label>
        {filtered ? (
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              const next = new URLSearchParams(params);
              for (const key of ['q', 'element', 'weapon', 'rarity']) next.delete(key);
              setParams(next, { replace: true });
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>
      {query.data?.snapshot ? (
        <p role="status" className="text-xs text-zinc-400">
          {visible.length} of {characters.length} observed characters
        </p>
      ) : null}
      {visible.length ? (
        <UidCharacterGrid
          uid={uid}
          characters={visible}
          observations={history.records}
          currentKeys={current}
        />
      ) : query.data?.snapshot ? (
        <p role="status" className="glass-panel rounded-xl p-5">
          {characters.length
            ? 'No observed characters match this search or these filters.'
            : 'The public showcase is empty or private. No detailed character builds were returned.'}
        </p>
      ) : null}
    </main>
  );
}
