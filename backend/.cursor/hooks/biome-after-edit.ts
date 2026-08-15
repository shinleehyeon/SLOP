#!/usr/bin/env bun

const input = await Bun.stdin.text();
const projectRoot = `${import.meta.dir}/../..`;

let filePath = '';

try {
  const json = JSON.parse(input) as {
    file_path?: string;
    path?: string;
    files?: Array<{ path?: string }>;
  };

  filePath = json.file_path ?? json.path ?? json.files?.[0]?.path ?? '';
} catch {
  process.exit(0);
}

if (!filePath || !/\.(ts|tsx|jsonc?|mdc)$/.test(filePath)) {
  process.exit(0);
}

if (/node_modules|\/dist\/|\/generated\//.test(filePath)) {
  process.exit(0);
}

const absolutePath = filePath.startsWith('/') ? filePath : `${projectRoot}/${filePath}`;
const proc = Bun.spawn(['bunx', 'biome', 'check', '--write', absolutePath], {
  cwd: projectRoot,
  stdout: 'ignore',
  stderr: 'ignore',
});

await proc.exited;
process.exit(0);
