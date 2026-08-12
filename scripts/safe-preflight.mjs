import { spawnSync } from 'node:child_process';

const checks = [
  { name: 'app.js syntax', command: ['node', '--check', 'app.js'] },
  { name: 'tabs.js syntax', command: ['node', '--check', 'src/tabs.js'] },
  { name: 'map prompt syntax', command: ['node', '--check', 'src/map-prompt.js'] },
  { name: 'slide document syntax', command: ['node', '--check', 'src/slide-document.js'] },
  { name: 'promotion syntax', command: ['node', '--check', 'src/promotion.js'] },
  { name: 'smoke test', command: ['node', 'scripts/smoke-test.mjs'] },
];

function printAccessHelp(err, name) {
  const code = err.code || 'UNKNOWN';
  console.error('[preflight] ' + name + ' failed: ' + err.message);
  if (['EACCES', 'EPERM'].includes(code)) {
    console.error('[preflight] Access denied to execute check command (possible ACL/policy block).');
    console.error('[preflight] Verify folder/file ACL and run again with safe-run wrapper.');
  }
  console.error('[preflight] Node error code: ' + code);
}

let hasError = false;

for (const item of checks) {
  console.log('[preflight] ' + item.name);
  const [command, ...args] = item.command;
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    encoding: 'utf8',
  });

  if (result.error) {
    hasError = true;
    printAccessHelp(result.error, item.name);
    break;
  }

  const status = result.status ?? 1;
  if (status !== 0) {
    hasError = true;
    if (result.signal) {
      console.error('[preflight] ' + item.name + ' was terminated by signal: ' + result.signal);
    }
    console.error('[preflight] ' + item.name + ' failed with exit code ' + status);
    break;
  }
}

if (hasError) {
  process.exit(1);
}

console.log('\n[preflight] all checks passed');