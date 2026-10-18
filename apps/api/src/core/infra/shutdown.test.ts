import type { Server } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createShutdownHandler } from './shutdown.js';

afterEach(() => vi.useRealTimers());

function fixture() {
  let closed!: (error?: Error) => void;
  const server = {
    close: vi.fn((callback: typeof closed) => {
      closed = callback;
    }),
    closeIdleConnections: vi.fn(),
    closeAllConnections: vi.fn(),
  };
  const database = vi.fn().mockResolvedValue(undefined);
  const redis = vi.fn().mockResolvedValue(undefined);
  const drain = vi.fn(),
    exit = vi.fn();
  const logger = { info: vi.fn(), error: vi.fn() };
  const shutdown = createShutdownHandler({
    server: server as unknown as Server,
    drain,
    disconnect: [database, redis],
    logger,
    exit,
  });
  return {
    server,
    database,
    redis,
    drain,
    exit,
    shutdown,
    closed: (error?: Error) => closed(error),
  };
}

describe('Graceful process lifecycle', () => {
  it('drains once, waits for HTTP work, then disconnects dependencies and exits successfully', async () => {
    const f = fixture();
    f.shutdown('SIGTERM');
    f.shutdown('SIGINT');
    expect(f.drain).toHaveBeenCalledOnce();
    expect(f.server.close).toHaveBeenCalledOnce();
    expect(f.database).not.toHaveBeenCalled();
    f.closed();
    await vi.waitFor(() => expect(f.exit).toHaveBeenCalledWith(0));
    expect(f.database).toHaveBeenCalledOnce();
    expect(f.redis).toHaveBeenCalledOnce();
  });
  it('attempts all dependency cleanup even after failure and exits unsuccessfully', async () => {
    const f = fixture();
    f.database.mockRejectedValue(new Error('unavailable'));
    f.shutdown('SIGINT');
    f.closed();
    await vi.waitFor(() => expect(f.exit).toHaveBeenCalledWith(1));
    expect(f.redis).toHaveBeenCalledOnce();
  });
  it('cleans dependencies after a server close error', async () => {
    const f = fixture();
    f.shutdown('SIGTERM');
    f.closed(new Error('close error'));
    await vi.waitFor(() => expect(f.exit).toHaveBeenCalledWith(1));
    expect(f.database).toHaveBeenCalledOnce();
  });
  it('forces connections closed and exits after ten seconds', () => {
    vi.useFakeTimers();
    const f = fixture();
    f.shutdown('SIGTERM');
    vi.advanceTimersByTime(9999);
    expect(f.exit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(f.server.closeAllConnections).toHaveBeenCalledOnce();
    expect(f.exit).toHaveBeenCalledWith(1);
  });
});
