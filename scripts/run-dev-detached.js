#!/usr/bin/env node
/**
 * npm run dev 와 동일 스택 — Windows에서 별도 CMD/콘솔 창 없이 백그라운드 기동
 * 로그: .firebase/local-dev-server.log
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, devLogPath, appendLogLine } = require('./lib/dev-headless');

const JOBS = [
  { script: 'scripts/run-firebase-emulators-persist.js', label: 'emu' },
  { script: 'scripts/dev-wait-flask.js', label: 'api' },
  { script: 'scripts/dev-wait-next.js', label: 'web' },
];

function spawnHiddenJob(scriptRel, label) {
  const script = path.join(ROOT, scriptRel);
  appendLogLine(`\n--- ${new Date().toISOString()} [${label}] detached start ---\n`);

  const log = devLogPath();
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const logFd = fs.openSync(log, 'a');

  const child = spawn(process.execPath, [script], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    shell: false,
    windowsHide: true,
    env: {
      ...process.env,
      WIZCOCO_DEV_HEADLESS: '1',
      WIZCOCO_DEV_LOG: log,
    },
  });
  child.unref();
}

function main() {
  for (const { script, label } of JOBS) {
    spawnHiddenJob(script, label);
  }
  console.log(`[run-dev-detached] 백그라운드 기동 (콘솔 창 없음). 로그: ${path.relative(ROOT, devLogPath())}`);
}

main();
