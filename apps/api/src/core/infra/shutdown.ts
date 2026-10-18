import type { Server } from 'node:http';

interface ShutdownDependencies {
  server: Server;
  drain: () => void;
  disconnect: Array<() => Promise<void>>;
  logger: {
    info: (context: { signal: string }, message: string) => void;
    error: (message: string) => void;
  };
  exit?: (code: number) => void;
}

export function createShutdownHandler({
  server,
  drain,
  disconnect,
  logger,
  exit = process.exit,
}: ShutdownDependencies) {
  let shuttingDown = false;
  return (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    drain();
    logger.info({ signal }, 'Graceful shutdown initiated');
    const timer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      server.closeAllConnections();
      exit(1);
    }, 10_000);
    timer.unref();
    server.close((error) => {
      void (async () => {
        // Attempt every cleanup even if one dependency fails or throws synchronously.
        const results = await Promise.allSettled(
          disconnect.map((close) => Promise.resolve().then(close)),
        );
        clearTimeout(timer);
        if (error || results.some((result) => result.status === 'rejected')) {
          logger.error('Error closing HTTP server or disconnecting dependencies');
          exit(1);
          return;
        }
        logger.info({ signal }, 'Clean shutdown completed successfully');
        exit(0);
      })();
    });
    server.closeIdleConnections();
  };
}
