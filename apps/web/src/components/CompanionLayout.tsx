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
  ['/nikke/roster', 'NIKKE'],
] as const;

export function CompanionNavigation() {
  const logout = useAuthStore((state) => state.logout);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const location = useLocation();
  const disclosure = useRef<HTMLDetailsElement>(null);
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
        <button
          disabled={signingOut}
          onClick={() => {
            if (signingOut) return;
            setSigningOut(true);
            setLogoutError('');
            void fetchApi('/auth/logout', { method: 'POST', body: '{}' })
              .then(() => logout())
              .catch(() => setLogoutError('Could not sign out. Reconnect and try again.'))
              .finally(() => setSigningOut(false));
          }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
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
