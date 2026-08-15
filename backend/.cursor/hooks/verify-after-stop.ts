#!/usr/bin/env bun

const input = await Bun.stdin.text();

try {
  const json = JSON.parse(input) as {
    edited_files?: string[];
    files?: string[];
  };

  const edited = json.edited_files ?? json.files ?? [];
  const touchedSource = edited.some(
    (file) => /\.(ts|tsx)$/.test(file) && !/\/(dist|generated|node_modules)\//.test(file),
  );

  if (!touchedSource) {
    process.exit(0);
  }

  process.stdout.write(
    `${JSON.stringify({
      followup_message:
        'If you changed TypeScript source files, run `bun run check && bun run build` before finishing.',
    })}\n`,
  );
} catch {
  // fail open
}

process.exit(0);
