import type { WishResultItem } from '@celestia/api-contracts';

import { artworkDisplayName } from '../../lib/artwork';
import { GenshinAvatar } from '../GenshinAvatar';
import { GenshinWeaponIcon } from '../GenshinWeaponIcon';

export function WishItemCard({ item, pity }: { item: WishResultItem; pity?: number }) {
  const name = artworkDisplayName(item.itemKey);
  const is5Star = item.type === '5_STAR';
  const is4Star = item.type === '4_STAR';

  const cardStyle = is5Star
    ? 'border-amber-400/70 bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950 text-amber-200 shadow-lg shadow-amber-500/15'
    : is4Star
      ? 'border-purple-400/60 bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-950 text-purple-200 shadow-md shadow-purple-500/10'
      : 'border-blue-400/30 bg-gradient-to-b from-blue-950/20 via-zinc-900 to-zinc-950 text-blue-200';

  const stars = is5Star ? '★★★★★' : is4Star ? '★★★★' : '★★★';

  return (
    <div
      className={`relative flex flex-col items-center justify-between rounded-xl border p-3 text-center transition-transform hover:-translate-y-0.5 ${cardStyle}`}
    >
      {item.isFeatured && (
        <span className="absolute -top-2 left-2 z-10 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
          Featured
        </span>
      )}
      {pity !== undefined && (
        <span className="absolute -top-2 right-2 z-10 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
          Pity {pity}
        </span>
      )}

      <div className="my-2 flex h-20 w-20 items-center justify-center">
        {item.itemKind === 'character' ? (
          <GenshinAvatar characterKey={item.itemKey} size="lg" />
        ) : (
          <GenshinWeaponIcon weaponKey={item.itemKey} size="lg" />
        )}
      </div>

      <div className="w-full space-y-1">
        <p className="truncate text-sm font-semibold text-white" title={name}>
          {name}
        </p>
        <p className="text-xs tracking-widest">{stars}</p>
        <p className="text-[10px] uppercase tracking-wider text-zinc-400">{item.itemKind}</p>
      </div>
    </div>
  );
}
