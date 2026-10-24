import { showcaseUidSchema } from '@celestia/api-contracts';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useUidDialog } from '../lib/uid-dialog';
import { uidNavigationActive, UidWorkspaceContext } from '../lib/uid-workspace';
import { useShowcase } from '../lib/use-showcase';
import CompanionLayout, { MobileNavigation } from './CompanionLayout';
import { CelestiaMark, UiIcon } from './Ui';

function UidNavigation({ uid, nickname }: { uid?: string; nickname?: string }) {
  const openUidDialog = useUidDialog();
  const location = useLocation();
  const base = uid ? `/u/${uid}` : '/';
  const primary = [
    [base, 'Today'],
    [uid ? `${base}/roster` : '/?add=characters', 'Characters'],
    [uid ? `${base}/teams` : '/?add=teams', 'Teams'],
  ] as const;
  const supporting = [[uid ? `${base}/showcase` : '/?add=profile', 'Public profile']] as const;
  const icons: Record<string, Parameters<typeof UiIcon>[0]['name']> = {
    [base]: 'today',
    [primary[1][0]]: 'characters',
    [primary[2][0]]: 'characters',
    [supporting[0][0]]: 'settings',
  };
  const isCurrent = (to: string, pathname: string) =>
    uid ? uidNavigationActive(to, pathname, uid) : to === '/' && pathname === '/';
  const label = uid ? 'Switch UID' : 'Add UID';
  return (
    <header className="companion-header">
      <a className="companion-skip" href="#companion-content">
        Skip to content
      </a>
      <div className="companion-brand-row">
        <Link to={base} className="celestia-brand">
          <CelestiaMark />
          <span>
            CELESTIA<small>GENSHIN COMPANION</small>
          </span>
        </Link>
        <MobileNavigation
          key={location.pathname}
          groups={[
            ['Your workspace', primary],
            ['Your showcase', supporting],
          ]}
          icons={icons}
          isCurrent={isCurrent}
          footer={
            <button
              type="button"
              className="button-secondary mt-5"
              onClick={(event) => {
                event.currentTarget.closest('dialog')?.close();
                openUidDialog();
              }}
            >
              {label}
            </button>
          }
        />
      </div>
      <div className="desktop-navigation">
        <p className="nav-caption">YOUR WORKSPACE</p>
        <nav aria-label="Primary navigation" className="companion-primary">
          {primary.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              aria-current={isCurrent(to, location.pathname) ? 'page' : undefined}
            >
              <UiIcon name={icons[to]} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <p className="nav-caption">YOUR SHOWCASE</p>
        <nav aria-label="Supporting navigation" className="companion-supporting">
          {supporting.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              aria-current={isCurrent(to, location.pathname) ? 'page' : undefined}
            >
              <UiIcon name={icons[to]} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {uid ? (
            <Link to={`${base}/showcase`} className="sidebar-account">
              <span className="account-initial">{(nickname ?? 'T').slice(0, 1).toUpperCase()}</span>
              <span>
                {nickname ?? 'Traveler'}
                <small>UID {uid}</small>
              </span>
            </Link>
          ) : (
            <p className="text-sm text-zinc-300">
              Your journey starts here.
              <small className="mt-1 block text-xs text-zinc-500">
                Add a UID to connect your showcase.
              </small>
            </p>
          )}
          <button type="button" className="button-secondary mt-4 w-full" onClick={openUidDialog}>
            {label}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            {uid
              ? 'Public showcase connected. No sign-in required.'
              : 'No sign-in or registration needed.'}
          </p>
        </div>
      </div>
    </header>
  );
}

export default function UidWorkspace() {
  const { uid = '' } = useParams();
  const query = useShowcase(uid);
  if (!showcaseUidSchema.safeParse(uid).success)
    return (
      <main className="p-8 text-zinc-200">
        <p role="alert">This link needs a valid 9- or 10-digit Genshin UID.</p>
        <Link to="/" className="underline">
          Enter UID
        </Link>
      </main>
    );
  return (
    <UidWorkspaceContext value={{ uid, query }}>
      <CompanionLayout
        navigation={<UidNavigation uid={uid} nickname={query.data?.snapshot?.nickname} />}
        workspaceBar={
          <>
            <span>
              Genshin Impact <span aria-hidden="true">/</span> <strong>UID {uid}</strong>
            </span>
            <Link className="workspace-account" to={`/u/${uid}/showcase`}>
              {query.data?.snapshot?.nickname ?? 'Public profile'} <UiIcon name="settings" />
            </Link>
          </>
        }
        footer={
          <>
            <span>CELESTIA</span>
            <span>
              Public showcase via{' '}
              <a className="underline" href="https://enka.network" target="_blank" rel="noreferrer">
                Enka.Network
              </a>
            </span>
          </>
        }
      />
    </UidWorkspaceContext>
  );
}

/** The same Celestia shell, before the first UID has been connected. */
export function GuestWorkspace() {
  const openUidDialog = useUidDialog();
  return (
    <CompanionLayout
      navigation={<UidNavigation />}
      workspaceBar={
        <>
          <span>
            Genshin Impact <span aria-hidden="true">/</span> <strong>Your workspace</strong>
          </span>
          <button type="button" className="workspace-account" onClick={openUidDialog}>
            Add UID <UiIcon name="characters" />
          </button>
        </>
      }
      footer={
        <>
          <span>CELESTIA</span>
          <span>
            Public showcases via{' '}
            <a href="https://enka.network" target="_blank" rel="noreferrer">
              Enka.Network
            </a>
          </span>
        </>
      }
    />
  );
}
