export const accountDataPolicy = Object.freeze({
  rate: { burst: 3, refillMs: 60_000, capacity: 1_024 },
  concurrency: { global: 2, perIdentity: 1 },
  rows: 30_000,
  rowBytes: 262_144,
  textBytes: 8_388_608,
  outputBytes: 16_777_216,
  statementMs: 5_000,
  lockMs: 2_000,
  transactionMs: 15_000,
  responseMs: 30_000,
});
