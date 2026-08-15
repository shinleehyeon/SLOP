#!/usr/bin/env bun

import { spawn } from 'node:child_process';
import chalk from 'chalk';
import ora from 'ora';

const org = 'personal-k1o';
const project = 'sunrinthon12th';
const dist = './dist';

function runSentry(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('sentry-cli', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    child.stdout?.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(output.trim() || 'sentry-cli failed'));
    });
  });
}

async function main() {
  const spinner = ora({
    text: chalk.cyan('Injecting debug IDs...'),
    spinner: 'dots',
  }).start();

  try {
    await runSentry(['sourcemaps', 'inject', '--org', org, '--project', project, dist]);

    spinner.text = chalk.cyan('Uploading sourcemaps to Sentry...');
    await runSentry(['sourcemaps', 'upload', '--quiet', '--org', org, '--project', project, dist]);

    spinner.succeed(
      `${chalk.green('Sentry sourcemaps uploaded')} ${chalk.gray(`· ${org}/${project}`)}`,
    );
  } catch (error) {
    spinner.fail(chalk.red('Sentry sourcemaps upload failed'));

    const message = error instanceof Error ? error.message : String(error);
    if (message) {
      process.stderr.write(`${chalk.red(message)}\n`);
    }

    process.exit(1);
  }
}

main();
