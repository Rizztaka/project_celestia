import type { ReactNode } from 'react';

import type { ProfileState } from '../lib/profile-presentation';

const surfaces = {
  bright: 'border-indigo-300/50 bg-indigo-500/20',
  dark: 'border-zinc-700 bg-zinc-950',
  unknown: 'border-dashed border-zinc-600 bg-zinc-900/70',
};
export function SourceText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-200">
      {text.split(/\n\n+/).map((p, i) => (
        <p className="whitespace-pre-wrap break-words" key={i}>
          {p}
        </p>
      ))}
    </div>
  );
}
export function ProfileDescription({
  title,
  label,
  state = 'unknown',
  children,
}: {
  title: string;
  label: string;
  state?: ProfileState;
  children: ReactNode;
}) {
  return (
    <details
      data-profile-state={state}
      className={`min-w-0 rounded-xl border ${surfaces[state]} open:shadow-lg`}
    >
      <summary className="cursor-pointer rounded-xl p-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
        <span className="ml-1 font-semibold">{title}</span>
        <span className="mt-2 block text-xs font-medium text-zinc-200">
          {state === 'bright' ? '●' : state === 'dark' ? '◒' : '◇'} {label} · View description
        </span>
      </summary>
      <div className="space-y-3 border-t border-white/10 p-4">{children}</div>
    </details>
  );
}
