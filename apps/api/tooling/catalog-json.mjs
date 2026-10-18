// Generated snapshots must pass the same formatter as checked-in source files.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';

export async function writeCatalogJson(destination, value) {
  const filepath = destination instanceof URL ? fileURLToPath(destination) : destination;
  const serialized = await format(JSON.stringify(value), {
    ...(await resolveConfig(filepath)),
    filepath,
  });
  writeFileSync(destination, serialized);
  return serialized;
}
