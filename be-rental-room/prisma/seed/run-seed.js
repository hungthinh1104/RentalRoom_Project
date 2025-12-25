#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const candidates = [
  path.resolve(cwd, 'prisma/seed/seed.js'),     // normal runtime JS (if compiled in place)
  path.resolve(cwd, 'dist/prisma/seed/seed.js'), // compiled in dist
  path.resolve(__dirname, 'seed.js'),            // local packaged JS
  path.resolve(__dirname, 'seed.ts'),            // fallback to ts source
  path.resolve(cwd, 'prisma/seed/seed.ts'),      // fallback variant
];

const { spawnSync } = require('child_process');

function runProcess(command, args) {
  console.log(`> ${command} ${args.join(' ')}`);
  const res = spawnSync(command, args, { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status || 1);
}

(async function run() {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      if (candidate.endsWith('.js')) {
        console.log('Executing JS seed entry:', candidate);
        runProcess('node', [candidate, ...process.argv.slice(2)]);
        return;
      }

      if (candidate.endsWith('.ts')) {
        console.log('Executing TS seed via ts-node:', candidate);
        // prefer npx ts-node (bundled with project) to avoid global deps
        if (fs.existsSync(path.resolve(process.cwd(), 'node_modules/.bin/ts-node')) || fs.existsSync(path.resolve(__dirname, '../../node_modules/.bin/ts-node'))) {
          // use transpile-only to avoid runtime typecheck failures on seed scripts
        runProcess('npx', ['ts-node', '--transpile-only', candidate, ...process.argv.slice(2)]);
          return;
        } else {
          console.error('ts-node not found in project. Build JS first or install ts-node in the image.');
          process.exit(1);
        }
      }
    }
  }

  console.error('No seed entry found. Searched paths:\n' + candidates.join('\n'));
  process.exit(1);
})();
