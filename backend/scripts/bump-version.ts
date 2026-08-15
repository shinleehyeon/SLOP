#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';

type BumpTarget = 'major' | 'minor' | 'patch';

const pkgPath = join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
  version: string;
};

const bump = process.argv[2] as BumpTarget | undefined;
const amount = parseAmount(process.argv[3]);
const [major, minor, patch] = parseVersion(pkg.version);
const nextVersion = getNextVersion({
  amount,
  bump,
  major,
  minor,
  patch,
});

const spinner = ora({
  text: chalk.cyan('버전 업데이트 중...'),
  spinner: 'dots',
}).start();

pkg.version = nextVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

spinner.succeed(
  `Version updated: ${chalk.gray(`${major}.${minor}.${patch}`)} -> ${chalk.green(nextVersion)}`,
);

function parseAmount(value: string | undefined) {
  const amount = value === undefined ? 1 : Number(value);

  if (!Number.isInteger(amount) || amount === 0) {
    printError('Usage: bun run version:<major|minor|patch> <non-zero integer>');
    process.exit(1);
  }

  return amount;
}

function parseVersion(version: string) {
  const parts = version.split('.').map(Number);

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    printError(`Invalid package version: ${version}`);
    process.exit(1);
  }

  return parts as [number, number, number];
}

function getNextVersion(input: {
  bump: BumpTarget | undefined;
  amount: number;
  major: number;
  minor: number;
  patch: number;
}) {
  if (!input.bump || !['major', 'minor', 'patch'].includes(input.bump)) {
    printError('Usage: bun run version:<major|minor|patch> <amount>');
    process.exit(1);
  }

  if (input.bump === 'major') {
    return formatVersion(input.major + input.amount, 0, 0);
  }

  if (input.bump === 'minor') {
    return formatVersion(input.major, input.minor + input.amount, 0);
  }

  return formatVersion(input.major, input.minor, input.patch + input.amount);
}

function formatVersion(major: number, minor: number, patch: number) {
  if ([major, minor, patch].some((part) => part < 0)) {
    printError('Version cannot be negative');
    process.exit(1);
  }

  return `${major}.${minor}.${patch}`;
}

function printError(message: string) {
  process.stderr.write(`${chalk.red(message)}\n`);
}
