import { visualAssets } from '../lib/cdn-resolver';
import { ArtworkFrame } from './ArtworkFrame';
export function GenshinBossIcon({ bossKey }: { bossKey: string }) {
  const asset = visualAssets.bosses[bossKey];
  return (
    <ArtworkFrame
      name={asset?.name ?? bossKey}
      file={asset?.file}
      kind="boss"
      size="lg"
      className="border-rose-400/50 from-rose-800/80"
    />
  );
}
