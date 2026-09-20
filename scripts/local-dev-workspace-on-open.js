#!/usr/bin/env node
/**
 * 워크스페이스 열림 시: 로컬 dev 서버 기동(미실행 시) → 포트 대기 → Auth 시드 → Simple Browser 3탭
 * .vscode/tasks.json runOn folderOpen 에서 호출
 */
const net = require('net');
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function portOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(800);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

function ensureDevServer() {
  return portOpen(3000).then((up) => {
    if (up) {
      console.log('[dev:workspace:open] npm run dev — 이미 실행 중 (port 3000)');
      return;
    }
    console.log('[dev:workspace:open] npm run dev 시작…');
    const isWin = process.platform === 'win32';
    const child = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: ROOT,
      detached: true,
      stdio: 'ignore',
      shell: isWin,
    });
    child.unref();
  });
}

function waitForPorts() {
  const r = spawnSync(
    isWin() ? 'npx.cmd' : 'npx',
    [
      'wait-on',
      'tcp:127.0.0.1:3000',
      'tcp:127.0.0.1:4000',
      '-t',
      '180000',
    ],
    { cwd: ROOT, stdio: 'inherit', shell: isWin() },
  );
  if (r.status !== 0) {
    console.warn('[dev:workspace:open] 포트 대기 시간 초과 — 브라우저 탭만 시도합니다.');
  }
}

function isWin() {
  return process.platform === 'win32';
}

function seedAuthIfNeeded() {
  spawnSync(isWin() ? 'node.exe' : 'node', [path.join(__dirname, 'seed-auth-emulator.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function openBrowserTabs() {
  spawnSync(isWin() ? 'node.exe' : 'node', [path.join(__dirname, 'open-local-dev-simple-browser.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

async function main() {
  await ensureDevServer();
  waitForPorts();
  seedAuthIfNeeded();
  openBrowserTabs();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
