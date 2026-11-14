import React, { memo } from 'react';
import type { RotationAction, RotationActionType } from '../types/genshin';
import { ChevronRight } from 'lucide-react';

interface RotationBadgeListProps {
  actions: RotationAction[];
  size?: 'sm' | 'md';
  showSeparators?: boolean;
}

const ACTION_STYLES: Record<RotationActionType, { bg: string; text: string; border: string }> = {
  skill: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
  },
  'hold-skill': {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-200',
    border: 'border-cyan-400/40',
  },
  burst: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
  },
  charged: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
  },
  normal: {
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-200',
    border: 'border-zinc-700/50',
  },
  plunge: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  dash: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/20',
  },
  jump: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-300',
    border: 'border-teal-500/20',
  },
  swap: {
    bg: 'bg-slate-700/40',
    text: 'text-slate-300',
    border: 'border-slate-600/30',
  },
};

export const RotationBadgeList: React.FC<RotationBadgeListProps> = memo(({
  actions,
  size = 'md',
  showSeparators = true,
}) => {
  if (!actions || actions.length === 0) return null;

  const isSmall = size === 'sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {actions.map((action, idx) => {
        const style = ACTION_STYLES[action.type] || ACTION_STYLES.normal;
        return (
          <React.Fragment key={`${action.label}-${idx}`}>
            <span
              className={`inline-flex items-center font-mono font-bold rounded border shadow-xs transition-all ${
                style.bg
              } ${style.text} ${style.border} ${
                isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
              }`}
              title={action.description || action.label}
            >
              {action.label}
            </span>
            {showSeparators && idx < actions.length - 1 && (
              <ChevronRight
                className={`${
                  isSmall ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
                } text-zinc-500 shrink-0`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

RotationBadgeList.displayName = 'RotationBadgeList';
