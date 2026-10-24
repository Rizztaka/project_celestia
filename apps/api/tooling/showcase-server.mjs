// Started by the isolated launcher, which disables dotenv and supplies no real credentials.
import { app } from '../src/app.ts';
import { disconnectDatabase } from '../src/core/db/prisma.ts';

const server = app.listen(45750, '127.0.0.1', () =>
  console.log('Showcase API listening on 127.0.0.1:45750'),
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () =>
    server.close(() => void disconnectDatabase().finally(() => process.exit(0))),
  );
}
