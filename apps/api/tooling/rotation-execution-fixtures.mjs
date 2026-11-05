export const executionConfig = (action) => `
options iteration=1 duration=45 swap_delay=12;
bennett char lvl=90/90 cons=0 talent=1,8,8;
xiangling char lvl=90/90 cons=0 talent=1,8,8;
xingqiu char lvl=90/90 cons=0 talent=1,8,8;
fischl char lvl=90/90 cons=0 talent=1,8,8;
bennett add weapon="dullblade" refine=1 lvl=1/20;
xiangling add weapon="beginnersprotector" refine=1 lvl=1/20;
xingqiu add weapon="dullblade" refine=1 lvl=1/20;
fischl add weapon="huntersbow" refine=1 lvl=1/20;
target lvl=100 resist=0 pos=0,0 radius=1;
active bennett;
while 1 { bennett ${action}; wait(1); }
`;

export function summaryRun(diagnostics = true) {
  return {
    seed: '1',
    durationFrames: 600,
    totalDamage: 1000,
    dps: 100,
    ...(diagnostics ? { diagnosticsVersion: 1 } : {}),
    members: ['bennett', 'xiangling', 'xingqiu', 'fischl'].map((key, index) => ({
      key,
      damage: index === 0 ? 1000 : 0,
      activeFrames: index === 0 ? 600 : 0,
      actions: index === 0 ? 3 : 0,
      failedIntervals: index === 0 ? 1 : 0,
      ...(diagnostics
        ? {
            actionCounts: index === 0 ? { skill: 2, burst: 1 } : {},
            blockedAttempts: index === 0 ? { skill_cd: 120 } : {},
          }
        : {}),
    })),
  };
}
