import { safeFailure } from './policy.mjs';
import { parseArguments, recoveryRun } from './rehearse.mjs';

try {
  const result = await recoveryRun(parseArguments(process.argv.slice(2)), process.env);
  process.exitCode = result.exitCode;
} catch (error) {
  // Preflight may precede creation of a private evidence directory. Never dump
  // raw child-process exceptions or user-supplied environment values.
  console.error(JSON.stringify({ result: 'failed', stage: 'preflight', ...safeFailure(error) }));
  process.exitCode = 1;
}
