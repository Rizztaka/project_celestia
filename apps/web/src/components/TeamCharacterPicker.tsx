import type { ShowcaseCharacter } from '@celestia/api-contracts';
import { useEffect, useRef, useState } from 'react';

import { formIdentity } from '../lib/build-analysis/identity';
import { ELEMENT_THEMES } from '../lib/element-colors';

export function ElementCrest({ element }: { element: ShowcaseCharacter['element'] }) {
  const theme = ELEMENT_THEMES[element ?? 'Unknown'];
  return (
    <svg
      className={`team-element-crest ${theme.text}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={theme.icon} />
    </svg>
  );
}
export function TeamPortrait({
  character,
  className = '',
}: {
  character: ShowcaseCharacter;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return character.portrait && !failed ? (
    <img
      className={className}
      src={character.portrait}
      onError={() => setFailed(true)}
      alt=""
      width={144}
      height={144}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className={`team-portrait-fallback ${className}`} aria-hidden="true">
      {character.name.slice(0, 1)}
    </span>
  );
}
export default function TeamCharacterPicker({
  slot,
  characters,
  excludedForms,
  onSelect,
  onClose,
}: {
  slot: number;
  characters: ShowcaseCharacter[];
  excludedForms: string[];
  onSelect: (character: ShowcaseCharacter) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [element, setElement] = useState('All');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.showModal();
    search.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const filtered = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(term.toLowerCase()) &&
      (element === 'All' || c.element === element),
  );
  return (
    <dialog
      ref={dialog}
      className="team-picker-dialog"
      aria-labelledby="team-picker-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const r = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <div>
          <p className="eyebrow">YOUR OBSERVED CHARACTERS</p>
          <h2 id="team-picker-title">Choose member {slot + 1}</h2>
        </div>
        <button
          type="button"
          className="team-icon-button"
          aria-label="Close character picker"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <label className="team-picker-search">
        <span>Search characters</span>
        <input
          ref={search}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Find a character…"
        />
      </label>
      <div className="team-element-filters" aria-label="Filter characters by element">
        {['All', 'Pyro', 'Hydro', 'Anemo', 'Electro', 'Cryo', 'Geo', 'Dendro'].map((e) => (
          <button key={e} type="button" aria-pressed={element === e} onClick={() => setElement(e)}>
            {e === 'All' ? (
              'All'
            ) : (
              <>
                <ElementCrest element={e as ShowcaseCharacter['element']} />
                <span className="sr-only">{e}</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className="team-picker-grid">
        {filtered.map((c) => {
          const disabled = excludedForms.includes(formIdentity({ avatarId: c.id }));
          return (
            <button
              key={c.key}
              type="button"
              className="team-picker-character"
              disabled={disabled}
              onClick={() => onSelect(c)}
              aria-label={`Choose ${c.name}${disabled ? ', already in team' : ''}`}
            >
              <div className={`team-picker-art team-element-${c.element ?? 'Unknown'}`}>
                <TeamPortrait key={c.portrait} character={c} />
                <span className="team-picker-level">Lv. {c.level ?? '?'}</span>
                <ElementCrest element={c.element} />
              </div>
              <strong>{c.name}</strong>
              <small>{disabled ? 'In your team' : `C${c.constellation}`}</small>
            </button>
          );
        })}
      </div>
      {!filtered.length ? (
        <p className="analysis-muted">No observed characters match these filters.</p>
      ) : null}
      <footer>{characters.length} observed characters · Builds stay saved in this browser.</footer>
    </dialog>
  );
}
