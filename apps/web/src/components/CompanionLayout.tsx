import '../styles/companion.css';

import { type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import { CelestiaMark, UiIcon } from './Ui';

const primary = [
  ['/workspace', 'Today'],
  ['/roster', 'Characters'],
  ['/planner', 'Planner'],
  ['/inventory', 'Inventory'],
] as const;
const supporting = [
  ['/showcase', 'My Showcase'],
  ['/import', 'Import'],
  ['/profile', 'Settings & profile'],
] as const;
const secondary = [
  ['/intelligence', 'Build lab'],
  ['/endgame', 'Endgame records'],
] as const;

export function MobileNavigation({
  signOut,
  signingOut = false,
  groups,
  icons = navIcons,
  footer,
  isCurrent,
}: {
  signOut?: () => void;
  signingOut?: boolean;
  groups?: readonly (readonly [string, readonly (readonly [string, string])[]])[];
  icons?: Record<string, Parameters<typeof UiIcon>[0]['name']>;
  footer?: ReactNode;
  isCurrent?: (to: string, pathname: string) => boolean;
}) {
  const { pathname } = useLocation();
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 640px)');
    const closeOnResize = () => {
      if (wide.matches) drawer.current?.close();
    };
    wide.addEventListener('change', closeOnResize);
    return () => wide.removeEventListener('change', closeOnResize);
  }, []);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="companion-menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => {
          if (drawer.current?.open) drawer.current.close();
          else {
            drawer.current?.showModal();
            setOpen(true);
          }
        }}
      >
        <svg
          aria-hidden="true"
          className="mr-2 h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d={open ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
        Menu
      </button>
      <dialog
        ref={drawer}
        id="mobile-nav-drawer"
        className="companion-drawer"
        aria-labelledby="mobile-nav-title"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
          );
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="mobile-nav-title" className="text-lg font-semibold">
            Navigation
          </h2>
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            aria-label="Close navigation"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </div>
        {(
          groups ??
          ([
            ['Your workspace', primary],
            ['Explore', secondary],
            ['Your account', supporting],
          ] as const)
        ).map(([label, links]) => (
          <nav key={label} aria-label={`${label} mobile navigation`} className="mt-5 flex flex-col">
            <h3 className="mb-1 px-3 text-xs uppercase tracking-wider text-indigo-200">{label}</h3>
            {links.map(([to, name]) => (
              <Link
                key={to}
                to={to}
                aria-current={
                  (
                    isCurrent
                      ? isCurrent(to, pathname)
                      : to === '/workspace'
                        ? pathname === '/workspace'
                        : pathname === to ||
                          pathname.startsWith(to + '/') ||
                          (to === '/roster' && pathname.startsWith('/characters/'))
                  )
                    ? 'page'
                    : undefined
                }
                onClick={() => drawer.current?.close()}
              >
                <UiIcon name={icons[to]} />
                {name}
              </Link>
            ))}
          </nav>
        ))}
        {footer}
        {signOut ? (
          <button
            type="button"
            className="mt-5 w-full border border-zinc-600"
            disabled={signingOut}
            onClick={signOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        ) : null}
      </dialog>
    </>
  );
}

const navIcons: Record<string, Parameters<typeof UiIcon>[0]['name']> = {
  '/showcase': 'characters',
  '/workspace': 'today',
  '/roster': 'characters',
  '/planner': 'planner',
  '/inventory': 'inventory',
  '/intelligence': 'insights',
  '/endgame': 'endgame',
  '/import': 'import',
  '/profile': 'settings',
};

export function CompanionNavigation() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const location = useLocation();
  const signOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError('');
    void fetchApi('/auth/logout', { method: 'POST', body: '{}' })
      .then(() => logout())
      .catch(() => setLogoutError('Could not sign out. Reconnect and try again.'))
      .finally(() => setSigningOut(false));
  };
  return (
    <header className="companion-header">
      <a className="companion-skip" href="#companion-content">
        Skip to content
      </a>
      <div className="companion-brand-row">
        <Link to="/" className="celestia-brand">
          <CelestiaMark />
          <span>
            CELESTIA<small>GENSHIN COMPANION</small>
          </span>
        </Link>
        <MobileNavigation
          key={`${location.pathname}${location.search}${location.hash}`}
          signOut={signOut}
          signingOut={signingOut}
        />
      </div>
      <div className="desktop-navigation">
        <p className="nav-caption">YOUR WORKSPACE</p>
        <nav aria-label="Primary navigation" className="companion-primary">
          {primary.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              aria-current={
                (
                  to === '/workspace'
                    ? location.pathname === '/workspace'
                    : location.pathname === to ||
                      location.pathname.startsWith(to + '/') ||
                      (to === '/roster' && location.pathname.startsWith('/characters/'))
                )
                  ? 'page'
                  : undefined
              }
            >
              <UiIcon name={navIcons[to]} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <p className="nav-caption">EXPLORE</p>
        <nav aria-label="Supporting navigation" className="companion-supporting">
          {secondary.map(([to, label]) => (
            <NavLink key={to} to={to}>
              <UiIcon name={navIcons[to]} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link
            className="sidebar-import"
            to="/import"
            aria-current={location.pathname === '/import' ? 'page' : undefined}
          >
            <UiIcon name="import" />
            <span>
              Import account data<small>Bring your builds along</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
          <Link
            to="/profile"
            className="sidebar-account"
            aria-current={location.pathname === '/profile' ? 'page' : undefined}
          >
            <span className="account-initial">
              {(user?.username ?? 'T').slice(0, 1).toUpperCase()}
            </span>
            <span>
              {user?.username ?? 'Traveler'}
              <small>Settings & profile</small>
            </span>
            <UiIcon name="settings" />
          </Link>
          <button className="companion-desktop-signout" disabled={signingOut} onClick={signOut}>
            <UiIcon name="logout" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
      {logoutError && (
        <p role="alert" className="logout-error">
          {logoutError}
        </p>
      )}
    </header>
  );
}

// Inside Suspense: focus runs after the lazy page has committed its main region.
function PageContent() {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  useEffect(() => {
    // Query-backed pages can replace their loading heading after navigation.
    // Update the title without moving focus away from the user's current control.
    const updateTitle = () => {
      const heading = document.querySelector('#companion-content h1')?.textContent;
      if (heading) document.title = `${heading} · Project Celestia`;
    };
    updateTitle();
    const observer = new MutationObserver(updateTitle);
    observer.observe(document.getElementById('root')!, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [location.pathname]);
  useEffect(() => {
    const main = document.getElementById('companion-content');
    const changedPage = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    const reachAnchor = () => {
      let target: HTMLElement | null = null;
      try {
        target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      } catch {
        /* Malformed external hashes must not break navigation. */
      }
      if (!target) return false;
      if (target instanceof HTMLDetailsElement) target.open = true;
      target.scrollIntoView();
      (target.querySelector<HTMLElement>('summary, input, select, button') ?? target).focus();
      return true;
    };
    if (reachAnchor()) return;
    if (changedPage) {
      main?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    // Direct links may arrive before the query-backed form mounts.
    if (!location.hash) return;
    const observer = new MutationObserver(() => {
      if (reachAnchor()) observer.disconnect();
    });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.search, location.hash]);
  return <Outlet />;
}

export default function CompanionLayout({
  navigation,
  workspaceBar,
  footer,
}: {
  navigation?: ReactNode;
  workspaceBar?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="companion-shell">
      {navigation ?? <CompanionNavigation />}
      <div className="companion-workspace">
        <div className="workspace-bar">
          {workspaceBar ?? (
            <>
              <span>
                Genshin Impact <span aria-hidden="true">/</span> <strong>Personal workspace</strong>
              </span>
              <Link to="/profile" className="workspace-account">
                Your account <UiIcon name="settings" />
              </Link>
            </>
          )}
        </div>
        <Suspense
          fallback={
            <main id="companion-content" tabIndex={-1}>
              <p role="status">Loading page…</p>
            </main>
          }
        >
          <PageContent />
        </Suspense>
        <footer className="workspace-footer">
          {footer ?? (
            <>
              <span>CELESTIA</span>
              <span>Your journey. At your pace.</span>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
