import '../styles/companion.css';

import { Link, Outlet } from 'react-router-dom';

import { CelestiaMark } from './Ui';

export default function ShowcaseLayout() {
  return (
    <div className="companion-shell min-h-screen bg-[#141518] text-zinc-100">
      <a className="companion-skip" href="#showcase-content">
        Skip to content
      </a>
      <div className="mx-auto max-w-5xl space-y-7 px-5 py-7 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link to="/" className="celestia-brand">
            <CelestiaMark />
            <span>Project Celestia</span>
          </Link>
          <span className="text-sm text-zinc-400">Genshin Impact · Public showcase</span>
        </header>
        <main id="showcase-content" className="min-w-0 space-y-6">
          <Outlet />
        </main>
        <footer className="border-t border-white/10 pt-5 text-xs leading-relaxed text-zinc-500">
          Public data via{' '}
          <a href="https://enka.network" target="_blank" rel="noreferrer" className="underline">
            Enka.Network
          </a>
          . Only showcased characters and equipped builds are available. Enka may serve cached game
          data after a refresh.
        </footer>
      </div>
    </div>
  );
}
