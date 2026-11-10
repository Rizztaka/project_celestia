import type { ReviewedCharacterProfile } from '../lib/build-analysis/identity';
import type { BuildRoleId } from '../lib/build-analysis/types';

interface CharacterGuideCardProps {
  profile: ReviewedCharacterProfile;
  currentRoleId?: BuildRoleId;
}

export function CharacterGuideCard({ profile, currentRoleId }: CharacterGuideCardProps) {
  const guide = profile.guide;
  if (!guide) return null;

  const activeRole =
    profile.roles.find((r) => r.id === currentRoleId) ??
    profile.roles.find((r) => r.id === profile.defaultRoleId) ??
    profile.roles[0];

  const tier1Sets = activeRole?.sets.filter((s) => s.tier === 1) ?? [];
  const tier2Sets = activeRole?.sets.filter((s) => s.tier === 2) ?? [];
  const tier3Sets = activeRole?.sets.filter((s) => s.tier === 3) ?? [];

  const tier1Weapons = guide.weapons.filter((w) => w.tier === 1);
  const tier2Weapons = guide.weapons.filter((w) => w.tier === 2);
  const tier3Weapons = guide.weapons.filter((w) => w.tier === 3);

  const formatSetName = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2');

  const rarityColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return '#e5a544'; // Gold
      case 4:
        return '#a370f7'; // Purple
      default:
        return '#4aa3df'; // Blue
    }
  };

  const categoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'BiS':
        return { background: 'rgba(216, 190, 137, 0.2)', color: '#d8be89', border: '1px solid #655842' };
      case 'F2P':
        return { background: 'rgba(74, 163, 223, 0.2)', color: '#7bc5f7', border: '1px solid #336688' };
      case 'Utility':
        return { background: 'rgba(92, 197, 138, 0.2)', color: '#75e2a7', border: '1px solid #336644' };
      default:
        return { background: 'rgba(255, 255, 255, 0.08)', color: '#d9d5cc', border: '1px solid #46454a' };
    }
  };

  return (
    <div className="character-guide-card" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.8rem',
      padding: '1.25rem',
      marginBlock: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#f0ece2', fontSize: '1.15rem' }}>
            {profile.displayName} Theorycrafting Guide
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#a6a6ae' }}>
            Verified KeqingMains (KQM) build recommendations
          </span>
        </div>
        <a
          href={guide.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '0.8rem',
            color: '#d8be89',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.65rem',
            background: 'rgba(216, 190, 137, 0.12)',
            borderRadius: '0.4rem',
            border: '1px solid rgba(216, 190, 137, 0.3)',
          }}
        >
          View Full KQM Guide ↗
        </a>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.4rem 0', color: '#d8be89', fontSize: '0.92rem' }}>Playstyle Overview</h4>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.6', color: '#c7c5c9' }}>
          {guide.playstyleSummary}
        </p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.4rem 0', color: '#d8be89', fontSize: '0.92rem' }}>Energy Recharge Context</h4>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.6', color: '#c7c5c9' }}>
          {guide.energyRequirements}
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.6rem 0', color: '#d8be89', fontSize: '0.92rem' }}>
          Ranked Artifact Sets ({activeRole?.id ? activeRole.id.replace(/_/g, ' ') : 'Primary Role'})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tier1Sets.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(216, 190, 137, 0.08)', borderRadius: '0.4rem', borderLeft: '3px solid #d8be89' }}>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', background: '#d8be89', color: '#121214', fontWeight: 600, borderRadius: '0.2rem' }}>
                Tier 1
              </span>
              <span style={{ fontWeight: 500, color: '#f0ece2', fontSize: '0.88rem' }}>
                {s.pieces}pc {formatSetName(s.referenceKey)}
              </span>
              {s.label && <span style={{ fontSize: '0.8rem', color: '#a6a6ae', marginLeft: 'auto' }}>{s.label}</span>}
            </div>
          ))}
          {tier2Sets.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.4rem', borderLeft: '3px solid #8c8982' }}>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', background: '#555451', color: '#e0dedb', fontWeight: 600, borderRadius: '0.2rem' }}>
                Tier 2
              </span>
              <span style={{ fontWeight: 500, color: '#f0ece2', fontSize: '0.88rem' }}>
                {s.pieces}pc {formatSetName(s.referenceKey)}
              </span>
              {s.label && <span style={{ fontSize: '0.8rem', color: '#a6a6ae', marginLeft: 'auto' }}>{s.label}</span>}
            </div>
          ))}
          {tier3Sets.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.4rem', borderLeft: '3px solid #504e4a' }}>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', background: '#383735', color: '#b0ada7', fontWeight: 600, borderRadius: '0.2rem' }}>
                Tier 3
              </span>
              <span style={{ fontWeight: 500, color: '#f0ece2', fontSize: '0.88rem' }}>
                {s.pieces}pc {formatSetName(s.referenceKey)}
              </span>
              {s.label && <span style={{ fontSize: '0.8rem', color: '#a6a6ae', marginLeft: 'auto' }}>{s.label}</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.6rem 0', color: '#d8be89', fontSize: '0.92rem' }}>
          Ranked Weapon Recommendations
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { tierName: 'Tier 1 · Best-in-Slot', items: tier1Weapons, borderColor: '#d8be89' },
            { tierName: 'Tier 2 · Competitive Alternatives', items: tier2Weapons, borderColor: '#8c8982' },
            { tierName: 'Tier 3 · F2P & Budget Options', items: tier3Weapons, borderColor: '#504e4a' },
          ]
            .filter((group) => group.items.length > 0)
            .map((group, gIdx) => (
              <div key={gIdx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d8be89', marginBottom: '0.5rem' }}>
                  {group.tierName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {group.items.map((w, wIdx) => (
                    <div
                      key={wIdx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        padding: '0.45rem 0.6rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#f0ece2', fontSize: '0.88rem' }}>
                          {w.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: rarityColor(w.rarity),
                          }}
                        >
                          {'★'.repeat(w.rarity)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '0.25rem',
                            fontWeight: 600,
                            ...categoryBadgeStyle(w.category),
                          }}
                        >
                          {w.category}
                        </span>
                      </div>
                      {w.notes && (
                        <span style={{ fontSize: '0.78rem', color: '#a6a6ae', lineHeight: '1.4' }}>
                          {w.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#d8be89', fontSize: '0.92rem' }}>
          Combat & Rotation Tips
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {guide.combatTips.map((tip, idx) => (
            <li key={idx} style={{ fontSize: '0.84rem', color: '#c7c5c9', lineHeight: '1.5' }}>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
