import { characterMetadata } from './artwork';

// Small inline SVG crests keep the offline fallback independent of every CDN.
export const ELEMENT_THEMES = {
  Pyro: {
    text: 'text-red-400',
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    glow: 'rgba(239, 68, 68, 0.3)',
    icon: 'M12 2c2 5-1 6 2 9 1-2 2-3 2-4 5 6 5 13-4 15C3 20 3 13 7 9c0 4 2 5 3 5-2-5 3-7 2-12Z',
  },
  Hydro: {
    text: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    glow: 'rgba(56, 189, 248, 0.3)',
    icon: 'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Zm-4 12a4 4 0 0 0 4 5',
  },
  Anemo: {
    text: 'text-teal-400',
    border: 'border-teal-500/40',
    bg: 'bg-teal-500/10',
    glow: 'rgba(45, 212, 191, 0.3)',
    icon: 'M12 12C8 3 2 5 3 10c1 4 5 5 9 2Zm0 0c4-9 10-7 9-2-1 4-5 5-9 2Zm0 0-4 8 4-3 4 3-4-8Z',
  },
  Electro: {
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    glow: 'rgba(192, 132, 252, 0.3)',
    icon: 'm13 2-8 12h6l-1 8 9-13h-6l1-7Zm-9 2L2 8m18 8 2 4',
  },
  Dendro: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    glow: 'rgba(52, 211, 153, 0.3)',
    icon: 'M12 22V12m0 5C2 18 2 8 3 5c7 0 9 5 9 12Zm0 0c10 1 10-9 9-12-7 0-9 5-9 12Zm0-5C7 8 9 4 12 2c3 2 5 6 0 10Z',
  },
  Cryo: {
    text: 'text-cyan-300',
    border: 'border-cyan-400/40',
    bg: 'bg-cyan-400/10',
    glow: 'rgba(103, 232, 249, 0.3)',
    icon: 'M12 2v20M3 7l18 10M3 17 21 7M8 4l4 3 4-3M8 20l4-3 4 3M3 11l4-2-1-4m12 14-1-4 4-2M3 13l4 2-1 4M18 5l-1 4 4 2',
  },
  Geo: {
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    glow: 'rgba(251, 191, 36, 0.3)',
    icon: 'm12 2 9 10-9 10L3 12 12 2Zm0 5-4 5 4 5 4-5-4-5Z',
  },
  Unknown: {
    text: 'text-zinc-300',
    border: 'border-zinc-500/40',
    bg: 'bg-zinc-500/10',
    glow: 'rgba(161, 161, 170, 0.3)',
    icon: 'm12 2 2 7 8 3-8 3-2 7-2-7-8-3 8-3 2-7Z',
  },
};
export function getElementTheme(characterKey: string) {
  const value = characterMetadata[characterKey]?.element;
  const element =
    value && value in ELEMENT_THEMES ? (value as keyof typeof ELEMENT_THEMES) : 'Unknown';
  return { element, ...ELEMENT_THEMES[element] };
}
