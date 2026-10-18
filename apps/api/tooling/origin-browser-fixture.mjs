// C5a synthetic smoke only. Serve the actual app, including its own preflight policy.
import { disposableTestDatabase } from '../dist/core/db/disposable-test-database.js';

if (!disposableTestDatabase()) throw new Error('Explicit disposable database required.');
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/core/db/prisma.js');
const { AuthService } = await import('../dist/platform/auth/auth.service.js');
const email = 'c5a-smoke@test.invalid';
if (!(await prisma.user.findUnique({ where: { email } })))
  await new AuthService().register({
    email,
    username: 'c5a-smoke',
    password: 'Celestia-c5a-only!',
  });

const server = app.listen(45448, '127.0.0.1', () =>
  console.log('C5a actual app ready at 127.0.0.1:45448'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
