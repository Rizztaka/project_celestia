import { Link } from 'react-router-dom';

import { CelestiaMark, PageHeader, UiIcon } from './Ui';

/** Shared Today introduction for account and UID workspaces. */
export default function DashboardWelcome({
  uid,
  onAddUid,
}: {
  uid?: string;
  onAddUid?: () => void;
}) {
  const base = `/u/${uid}`;
  return (
    <>
      <PageHeader
        eyebrow="YOUR PERSONAL COMPANION"
        title="Today, at your pace."
        description={
          onAddUid
            ? 'Your characters and builds, together in Celestia. Add your UID to begin.'
            : uid
              ? 'Your public characters and builds, together in Celestia.'
              : 'A clear view of what matters. A little room for what comes next.'
        }
        actions={
          onAddUid ? (
            <button type="button" className="button-secondary" onClick={onAddUid}>
              Add UID <UiIcon name="characters" />
            </button>
          ) : (
            <Link className="button-secondary" to={uid ? `${base}/roster` : '/planner'}>
              <UiIcon name={uid ? 'characters' : 'planner'} />
              {uid ? 'Open characters' : 'Open planner'}
            </Link>
          )
        }
      />
      <section className="today-hero" aria-label="Your journey">
        <div className="today-hero-content">
          <p className="eyebrow">LESS BUSYWORK. MORE TEYVAT.</p>
          <h2>
            Every great build
            <br />
            begins with a next step.
          </h2>
          <p>
            {onAddUid
              ? 'Connect your public Genshin showcase to see your characters, talents and equipped builds in one considered space.'
              : uid
                ? 'Your showcase is connected. Explore your characters, talents and equipped builds in one considered space.'
                : 'Make progress on your terms. Keep your characters, daily routine and longer plans in one considered space.'}
          </p>
          {onAddUid ? (
            <button type="button" className="button-primary" onClick={onAddUid}>
              Add UID <UiIcon name="arrow" />
            </button>
          ) : uid ? (
            <Link className="button-primary" to={`${base}/roster`}>
              View my characters <UiIcon name="arrow" />
            </Link>
          ) : (
            <a className="button-primary" href="#session-recording">
              Record my session <UiIcon name="arrow" />
            </a>
          )}
        </div>
        <div className="hero-orbits" aria-hidden="true">
          <CelestiaMark />
        </div>
      </section>
      {onAddUid ? (
        <div className="today-shortcuts">
          {(
            [
              ['characters', 'Your characters', 'Builds, talents & progression'],
              ['inventory', 'Your equipped gear', 'Weapons, artifacts & statistics'],
              ['settings', 'Your public profile', 'Account details & showcase refresh'],
            ] as const
          ).map(([icon, title, description]) => (
            <button type="button" key={icon} className="shortcut-card text-left" onClick={onAddUid}>
              <UiIcon name={icon} />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <UiIcon name="arrow" />
            </button>
          ))}
        </div>
      ) : (
        <div className="today-shortcuts">
          <Link className="shortcut-card" to={uid ? `${base}/roster` : '/roster'}>
            <UiIcon name="characters" />
            <span>
              <strong>Your characters</strong>
              <small>Builds, talents & progression</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
          <Link className="shortcut-card" to={uid ? `${base}/inventory` : '/planner?tab=farming'}>
            <UiIcon name={uid ? 'inventory' : 'planner'} />
            <span>
              <strong>{uid ? 'Your equipped gear' : 'Make a little progress'}</strong>
              <small>{uid ? 'Weapons, artifacts & statistics' : 'Your goals, in your order'}</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
          <Link className="shortcut-card" to={uid ? `${base}/showcase` : '/import'}>
            <UiIcon name={uid ? 'settings' : 'import'} />
            <span>
              <strong>{uid ? 'Your public profile' : 'Bring your builds along'}</strong>
              <small>
                {uid ? 'Account details & showcase refresh' : 'Review & import a GOOD export'}
              </small>
            </span>
            <UiIcon name="arrow" />
          </Link>
        </div>
      )}
    </>
  );
}
