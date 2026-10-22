import type { ReactNode } from 'react';

export function CelestiaMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="celestia-mark">
      <path
        d="m20 2 5.2 12.8L38 20l-12.8 5.2L20 38l-5.2-12.8L2 20l12.8-5.2L20 2Z"
        stroke="currentColor"
      />
      <path
        d="m20 10 2.8 7.2L30 20l-7.2 2.8L20 30l-2.8-7.2L10 20l7.2-2.8L20 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

const paths = {
  today:
    'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  characters:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M13 3.1a4 4 0 0 1 0 7.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  planner: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm3 10h3m-3 4h7',
  inventory: 'm3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10',
  insights: 'm9 3-1 5-5 1 5 2 1 5 2-5 5-2-5-1-2-5Zm9 10-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3Z',
  endgame: 'M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8',
  import: 'M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  logout: 'M9 4H4v16h5m4-12 4 4-4 4m-5-4h13',
} as const;

export function UiIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ui-icon"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function AuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <div className="auth-wordmark">
          <CelestiaMark />
          <span>CELESTIA</span>
        </div>
        <div className="auth-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
          <CelestiaMark />
        </div>
        <p className="eyebrow">YOUR JOURNEY, CONSIDERED.</p>
        <h2>
          A little clarity.
          <br />A world of possibility.
        </h2>
        <p>
          Your characters, your plans, your next step. A quieter companion for your time in Teyvat.
        </p>
        <span className="auth-footnote">An independent Genshin Impact companion</span>
      </aside>
      <section className="auth-form-area">
        <div className="auth-form">
          <div className="auth-mobile-brand">
            <CelestiaMark /> CELESTIA
          </div>
          <p className="eyebrow">WELCOME TO CELESTIA</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
