import type { ReactNode } from 'react';

export function AccessibleTabs<T extends string>({
  label,
  prefix,
  tabs,
  active,
  onChange,
}: {
  label: string;
  prefix: string;
  tabs: readonly { id: T; label: ReactNode }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-8 flex w-fit min-w-0 max-w-full flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1"
    >
      {tabs.map(({ id, label: content }, index) => (
        <button
          key={id}
          id={`${prefix}-tab-${id}`}
          role="tab"
          type="button"
          aria-selected={active === id}
          aria-controls={`${prefix}-panel-${id}`}
          tabIndex={active === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => {
            let next: number;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            onChange(tabs[next].id);
            document.getElementById(`${prefix}-tab-${tabs[next].id}`)?.focus();
          }}
          className={`min-w-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-5 ${active === id ? 'bg-indigo-500/20 text-indigo-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          {content}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  prefix,
  id,
  active,
  children,
}: {
  prefix: string;
  id: string;
  active: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${prefix}-panel-${id}`}
      aria-labelledby={`${prefix}-tab-${id}`}
      tabIndex={0}
      hidden={active !== id}
      className="min-w-0"
    >
      {active === id && children}
    </div>
  );
}
