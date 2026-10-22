import { Link } from 'react-router-dom';

import { referenceCharacters } from '../lib/artwork';
import { GenshinAvatar } from './GenshinAvatar';
import { UiIcon } from './Ui';

const catalog = Object.entries(referenceCharacters).sort((a, b) =>
  a[1].name.localeCompare(b[1].name),
);

export function CharacterCatalog({ search = '' }: { search?: string }) {
  const query = search.trim().toLocaleLowerCase().replace(/\s/g, '');
  const entries = catalog.filter(([key, item]) =>
    `${item.name}${key}`.toLocaleLowerCase().replace(/\s/g, '').includes(query),
  );
  return (
    <details className="catalog-disclosure">
      <summary>
        <span>Explore the character archive</span>
        <UiIcon name="arrow" />
      </summary>
      <p className="page-description">
        Read talents, constellations and equipment descriptions, even before importing. Archive
        entries do not imply ownership.
      </p>
      {entries.length ? (
        <div className="catalog-links">
          {entries.map(([key, item]) => (
            <Link key={key} to={`/characters/${encodeURIComponent(key)}`}>
              <GenshinAvatar characterKey={key} size="sm" showElementBadge={false} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="page-description">No archive entries match this search.</p>
      )}
    </details>
  );
}
