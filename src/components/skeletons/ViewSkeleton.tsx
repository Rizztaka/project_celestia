import React from 'react';

export const TeamsSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading Best Teams View"
    data-skeleton="teams"
    className="space-y-6 animate-pulse"
  >
    {/* Header / Generator Controls Card */}
    <div className="bg-[#10121c] border border-[#202538] rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[#1f253b] rounded-lg" />
          <div className="h-4 w-72 bg-[#171b2c] rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-[#1f253b] rounded-xl" />
          <div className="h-9 w-32 bg-[#1f253b] rounded-xl" />
        </div>
      </div>
      <div className="h-10 w-full max-w-md bg-[#161a29] rounded-xl border border-[#262c44]" />
      <div className="flex gap-2 pt-1 overflow-hidden">
        {[48, 64, 56, 72, 60, 52].map((w, i) => (
          <div
            key={i}
            style={{ width: `${w}px` }}
            className="h-7 bg-[#1b2034] rounded-lg shrink-0"
          />
        ))}
      </div>
    </div>

    {/* Team Cards Placeholder Grid */}
    <div className="space-y-4">
      {[1, 2].map((teamIdx) => (
        <div
          key={teamIdx}
          className="bg-[#121422] border border-[#22283e] rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1d2235]">
            <div className="flex items-center gap-3">
              <div className="h-6 w-40 bg-[#21273f] rounded-lg" />
              <div className="h-5 w-20 bg-[#1b2034] rounded-full" />
            </div>
            <div className="h-6 w-24 bg-[#232a42] rounded-lg" />
          </div>

          {/* 4 Character Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((slotIdx) => (
              <div
                key={slotIdx}
                className="bg-[#161928] border border-[#252c44] rounded-xl p-3 flex flex-col items-center space-y-2"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#21273f]" />
                <div className="h-3.5 w-16 bg-[#21273f] rounded" />
                <div className="h-2.5 w-20 bg-[#1a1f32] rounded" />
              </div>
            ))}
          </div>

          {/* Rotation & Metrics preview bar */}
          <div className="h-8 w-full bg-[#171b2b] rounded-xl border border-[#22273a]" />
        </div>
      ))}
    </div>
  </div>
);

export const PullsSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading Pull Advisor View"
    data-skeleton="pulls"
    className="space-y-6 animate-pulse"
  >
    {/* Active Banners Header Placeholder */}
    <div className="bg-[#10121c] border border-[#202538] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-44 bg-[#1f253b] rounded-lg" />
          <div className="h-4 w-64 bg-[#171b2c] rounded-md" />
        </div>
        <div className="h-8 w-36 bg-[#1f253b] rounded-xl" />
      </div>

      {/* Dual Featured Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {[1, 2].map((b) => (
          <div
            key={b}
            className="h-48 rounded-2xl bg-gradient-to-br from-[#161928] to-[#10121d] border border-[#242a42] p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-[#232940] rounded-md" />
              <div className="h-4 w-16 bg-[#232940] rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((r) => (
                <div key={r} className="w-10 h-10 rounded-xl bg-[#20263b]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Pull Budget & Gacha Probability Calculator Card */}
    <div className="bg-[#121422] border border-[#22283e] rounded-2xl p-6 space-y-4">
      <div className="h-5 w-48 bg-[#20263c] rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((c) => (
          <div key={c} className="h-20 bg-[#161a29] border border-[#242b42] rounded-xl p-3 space-y-2">
            <div className="h-3 w-20 bg-[#21273f] rounded" />
            <div className="h-6 w-28 bg-[#28304c] rounded" />
          </div>
        ))}
      </div>
      <div className="h-16 w-full bg-[#161a29] rounded-xl border border-[#22273a]" />
    </div>
  </div>
);

export const EndgameSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading Endgame Helper View"
    data-skeleton="endgame"
    className="space-y-6 animate-pulse"
  >
    {/* Mode Selector Header Bar */}
    <div className="bg-[#10121c] border border-[#202538] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex gap-2">
        <div className="h-9 w-36 bg-[#22283e] rounded-xl" />
        <div className="h-9 w-40 bg-[#181c2e] rounded-xl" />
      </div>
      <div className="h-8 w-48 bg-[#1b2033] rounded-lg" />
    </div>

    {/* Chamber / Act Challenge Cards */}
    <div className="space-y-4">
      {[1, 2, 3].map((chamber) => (
        <div
          key={chamber}
          className="bg-[#121422] border border-[#22283e] rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-28 bg-[#22283e] rounded-lg" />
              <div className="h-4 w-40 bg-[#1a1f33] rounded-md" />
            </div>
            <div className="h-6 w-20 bg-[#22283e] rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-[#161928] border border-[#242b42] rounded-xl p-3" />
            <div className="h-24 bg-[#161928] border border-[#242b42] rounded-xl p-3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ArtifactsSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading Artifact Stop View"
    data-skeleton="artifacts"
    className="space-y-6 animate-pulse"
  >
    {/* Artifact Sub-Navigation / Filter Pill Bar */}
    <div className="bg-[#10121c] border border-[#202538] rounded-2xl p-4 space-y-3">
      <div className="flex gap-2">
        <div className="h-9 w-36 bg-[#22283e] rounded-xl" />
        <div className="h-9 w-36 bg-[#181c2e] rounded-xl" />
      </div>
      <div className="flex gap-2 overflow-hidden pt-1">
        {[60, 80, 72, 64, 90].map((w, idx) => (
          <div
            key={idx}
            style={{ width: `${w}px` }}
            className="h-7 bg-[#1b2034] rounded-lg shrink-0"
          />
        ))}
      </div>
    </div>

    {/* Artifact Set / Slot Cards Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((card) => (
        <div
          key={card}
          className="bg-[#121422] border border-[#22283e] rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#22283e] shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-3/4 bg-[#22283e] rounded" />
              <div className="h-3 w-1/2 bg-[#1a1f33] rounded" />
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <div className="h-3 w-full bg-[#181c2c] rounded" />
            <div className="h-3 w-4/5 bg-[#181c2c] rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RosterSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading Roster View"
    data-skeleton="roster"
    className="space-y-5 animate-pulse"
  >
    {/* Roster Header Banner */}
    <div className="bg-[#10121c] border border-[#202538] rounded-2xl p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-6 w-44 bg-[#1f253b] rounded-lg" />
          <div className="h-3.5 w-60 bg-[#171b2c] rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-[#1f253b] rounded-xl" />
          <div className="h-8 w-32 bg-[#1f253b] rounded-xl" />
        </div>
      </div>

      {/* Region & Element Filters Placeholder */}
      <div className="flex gap-1.5 overflow-hidden pt-2">
        {[50, 65, 55, 60, 58, 62, 54, 70].map((w, idx) => (
          <div
            key={idx}
            style={{ width: `${w}px` }}
            className="h-6 bg-[#1b2034] rounded-lg shrink-0"
          />
        ))}
      </div>
    </div>

    {/* Characters Grid Placeholder */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
      {[...Array(15)].map((_, idx) => (
        <div
          key={idx}
          className="bg-[#121422] border border-[#22283e] rounded-2xl p-3 flex flex-col justify-between space-y-3 aspect-[4/5]"
        >
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-10 bg-[#21273f] rounded" />
            <div className="h-3.5 w-6 bg-[#21273f] rounded" />
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#21273f]" />
            <div className="h-3.5 w-20 bg-[#21273f] rounded" />
            <div className="h-2.5 w-14 bg-[#1a1f32] rounded" />
          </div>
          <div className="h-5 w-full bg-[#181c2d] rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const GenericSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading view content"
    data-skeleton="generic"
    className="space-y-5 animate-pulse"
  >
    <div className="h-24 bg-[#10121c] border border-[#202538] rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-36 bg-[#121422] border border-[#22283e] rounded-2xl"
        />
      ))}
    </div>
  </div>
);

interface ViewSkeletonProps {
  type?: string;
}

export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({ type }) => {
  switch (type) {
    case 'teams':
      return <TeamsSkeleton />;
    case 'pulls':
      return <PullsSkeleton />;
    case 'endgame':
      return <EndgameSkeleton />;
    case 'artifacts':
      return <ArtifactsSkeleton />;
    case 'roster':
      return <RosterSkeleton />;
    default:
      return <GenericSkeleton />;
  }
};
