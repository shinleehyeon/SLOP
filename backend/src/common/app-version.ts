import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cachedAppVersion: string | undefined;

export function getAppVersion() {
  cachedAppVersion ??= (
    JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      version: string;
    }
  ).version;

  return cachedAppVersion;
}
