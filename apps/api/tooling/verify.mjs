import { runVerification } from './verification.mjs';

try {
  await runVerification(process.env);
} catch (error) {
  // Child tools retain their own diagnostics. Do not serialize environment or connection strings.
  console.error(error instanceof Error ? error.message : 'Verification failed.');
  process.exitCode = 1;
}
