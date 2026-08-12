import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/safe-run.mjs <command> [args...]');
  process.exit(1);
}

const [cmd, ...cmdArgs] = args;
const result = spawnSync(cmd, cmdArgs, {
  stdio: 'inherit',
  encoding: 'utf8',
  shell: false,
  windowsHide: true,
});

if (result.error) {
  const err = result.error;
  const isAccessError = ['EACCES', 'EPERM'].includes(err.code);
  const message = err.message || String(err);
  const code = err.code || 'UNKNOWN';

  console.error('[safe-run] failed to execute "' + cmd + '": ' + message);
  if (isAccessError) {
    console.error('[safe-run] Reason: CreateProcess failed due to ACL/permission block (EACCES/EPERM).');
    console.error('[safe-run] Check that the executable/file path is not denied by ACL and you are running with correct privileges.');
  }
  console.error('[safe-run] node error code: ' + code);
  process.exit(1);
}

const status = result.status ?? 1;
if (status !== 0 && result.signal) {
  console.error('[safe-run] terminated by signal: ' + result.signal);
}

process.exit(status);