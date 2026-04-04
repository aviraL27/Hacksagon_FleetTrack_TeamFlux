import { spawn } from 'node:child_process';

const children = [];

function shutdown() {
  while (children.length) {
    const child = children.pop();

    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
}

function spawnProcess(args) {
  const child =
    process.platform === 'win32'
      ? spawn(`npm ${args.join(' ')}`, {
          cwd: process.cwd(),
          shell: true,
          stdio: 'inherit',
        })
      : spawn('npm', args, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }

    shutdown();
  });

  children.push(child);
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

spawnProcess(['run', 'dev:client']);
spawnProcess(['run', 'dev:server']);
