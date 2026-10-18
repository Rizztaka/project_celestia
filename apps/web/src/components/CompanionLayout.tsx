import '../styles/companion.css';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

const primary = [
  ['/', 'Today'],
  ['/roster', 'Characters'],
  ['/planner', 'Planner'],
] as const;
const supporting = [
  ['/import', 'Import'],
  ['/inventory', 'Inventory'],
  ['/profile', 'Settings & profile'],
] as const;
const secondary = [
  ['/intelligence', 'Intelligence'],
  ['/simulators', 'Pull simulator'],
  ['/endgame', 'Endgame records'],
] as const;

function MobileNavigation({ signOut, signingOut }: { signOut: () => void; signingOut: boolean }) {
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
          [
            ['Primary', primary],
            ['Supporting', supporting],
            ['Other tools', secondary],
          ] as const
        ).map(([label, links]) => (
          <nav key={label} aria-label={`${label} mobile navigation`} className="mt-5 flex flex-col">
            <h3 className="mb-1 px-3 text-xs uppercase tracking-wider text-indigo-200">{label}</h3>
            {links.map(([to, name]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => drawer.current?.close()}>
                {name}
              </NavLink>
            ))}
          </nav>
        ))}
        <button
          type="button"
          className="mt-5 w-full border border-zinc-600"
          disabled={signingOut}
          onClick={signOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </dialog>
    </>
  );
}

export function CompanionNavigation() {
  const logout = useAuthStore((state) => state.logout);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const location = useLocation();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const signOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError('');
    void fetchApi('/auth/logout', { method: 'POST', body: '{}' })
      .then(() => logout())
      .catch(() => setLogoutError('Could not sign out. Reconnect and try again.'))
      .finally(() => setSigningOut(false));
  };
  useEffect(() => {
    if (disclosure.current) disclosure.current.open = false;
  }, [location.pathname, location.search, location.hash]);
  useEffect(() => {
    const dismiss = (event: PointerEvent | KeyboardEvent) => {
      const element = disclosure.current;
      if (!element?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return;
        element.open = false;
        element.querySelector('summary')?.focus();
        event.preventDefault();
      } else if (event.target instanceof Node && !element.contains(event.target)) {
        const containedFocus = element.contains(document.activeElement);
        element.open = false;
        if (containedFocus) element.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', dismiss);
    return () => {
      document.removeEventListener('keydown', dismiss);
      document.removeEventListener('pointerdown', dismiss);
    };
  }, []);
  return (
    <header className="companion-header">
      <a className="companion-skip" href="#companion-content">
        Skip to content
      </a>
      <div className="companion-brand-row">
        <Link to="/" className="font-display text-lg font-bold text-white">
          Project Celestia
        </Link>
        <button className="companion-desktop-signout" disabled={signingOut} onClick={signOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        <MobileNavigation
          key={`${location.pathname}${location.search}${location.hash}`}
          signOut={signOut}
          signingOut={signingOut}
        />
      </div>
      {logoutError && (
        <p role="alert" className="p-2 text-sm text-amber-200">
          {logoutError}
        </p>
      )}
      <nav aria-label="Primary navigation" className="companion-primary">
        {primary.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {label}
          </NavLink>
        ))}
      </nav>
      <nav aria-label="Supporting navigation" className="companion-supporting">
        {supporting.map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
        <details ref={disclosure} className="companion-tools">
          <summary>
            Other tools{secondary.some(([to]) => to === location.pathname) ? ' · viewing' : ''}
          </summary>
          <div className="companion-tool-links">
            {secondary.map(([to, label]) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
            <details>
              <summary>Archived Stubs</summary>
              <NavLink to="/nikke/roster">NIKKE (legacy)</NavLink>
            </details>
          </div>
        </details>
      </nav>
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

export default function CompanionLayout() {
  return (
    <div className="companion-shell">
      <CompanionNavigation />
      <Suspense
        fallback={
          <main id="companion-content" tabIndex={-1}>
            <p role="status">Loading page…</p>
          </main>
        }
      >
        <PageContent />
      </Suspense>
    </div>
  );
}
