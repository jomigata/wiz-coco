#!/usr/bin/env node
/**
 * 워크스페이스(Cursor/VS Code) 열림 시:
 * 1) npm run dev (Emulator + Flask + Next) 기동·대기
 * 2) Auth 시드(없을 때만 추가)
 * 3) Simple Browser 3탭 (WIZCOCO_DEV_SKIP_BROWSER=1 이면 생략)
 *
 * .vscode/tasks.json runOn: folderOpen
 */
const fs = require('fs');
const net = require('net');
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_FILE = path.join(ROOT, '.firebase', 'local-dev-server.log');
const FLASK_HEALTH = 'http://127.0.0.1:5000/api/health';

function isWin() {
  return process.platform === 'win32';
}

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

async function stackReady() {
  const [emuFs, emuUi, api, web] = await Promise.all([
    portOpen(8080),
    portOpen(4000),
    portOpen(5000),
    portOpen(3000),
  ]);
  return emuFs && emuUi && api && web;
}

async function flaskHealthOk() {
  try {
    const res = await fetch(FLASK_HEALTH, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

function printStackStatus({ emu, apiHealth, web }) {
  console.log('\n[dev:workspace:open] 로컬 개발 스택');
  console.log('| 서비스 | 상태 | URL |');
  console.log('|--------|------|-----|');
  console.log(
    `| Firestore + Auth Emulator | ${emu ? '✔ All emulators ready' : '… 기동 중'} | http://127.0.0.1:4000 |`,
  );
  console.log(
    `| Flask API | ${apiHealth ? '✔ /api/health 200' : '… 기동 중'} | http://localhost:5000 |`,
  );
  console.log(`| Next.js | ${web ? '✔ Ready' : '… 기동 중'} | http://localhost:3000 |`);
  if (fs.existsSync(LOG_FILE)) {
    console.log(`| dev 로그 | | ${path.relative(ROOT, LOG_FILE)} |`);
  }
  console.log('');
}

async function ensureDevServer() {
  if (await stackReady()) {
    const apiHealth = await flaskHealthOk();
    console.log('[dev:workspace:open] npm run dev — 이미 실행 중');
    printStackStatus({ emu: true, apiHealth, web: true });
    return;
  }

  const partial = await Promise.all([portOpen(8080), portOpen(5000), portOpen(3000)]);
  if (partial.some(Boolean)) {
    console.warn(
      '[dev:workspace:open] 일부 포트만 사용 중입니다. 전체 스택을 위해 npm run dev 를 시작합니다.',
    );
  } else {
    console.log('[dev:workspace:open] npm run dev 시작…');
  }

  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  const logFd = fs.openSync(LOG_FILE, 'a');
  fs.writeSync(logFd, `\n--- ${new Date().toISOString()} dev:workspace:open ---\n`);

  const isWindows = isWin();
  const child = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    shell: isWindows,
  });
  child.unref();
  fs.closeSync(logFd);
}

function waitForStack() {
  const r = spawnSync(
    isWin() ? 'npx.cmd' : 'npx',
    [
      'wait-on',
      'tcp:127.0.0.1:8080',
      'tcp:127.0.0.1:4000',
      'tcp:127.0.0.1:5000',
      'tcp:127.0.0.1:3000',
      '-t',
      '240000',
    ],
    { cwd: ROOT, stdio: 'inherit', shell: isWin() },
  );
  return r.status === 0;
}

function seedAuthIfNeeded() {
  spawnSync(isWin() ? 'node.exe' : 'node', [path.join(__dirname, 'seed-auth-emulator.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function openBrowserTabs() {
  if (process.env.WIZCOCO_DEV_SKIP_BROWSER === '1') {
    console.log('[dev:workspace:open] Simple Browser 생략 (WIZCOCO_DEV_SKIP_BROWSER=1)');
    return;
  }
  spawnSync(isWin() ? 'node.exe' : 'node', [path.join(__dirname, 'open-local-dev-simple-browser.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

async function main() {
  await ensureDevServer();
  const ready = waitForStack();
  const apiHealth = ready ? await flaskHealthOk() : false;
  const web = ready ? await portOpen(3000) : false;
  const emu = ready ? await portOpen(4000) : false;

  if (!ready) {
    console.warn('[dev:workspace:open] 포트 대기 시간 초과 — 로그 확인:', LOG_FILE);
  }
  printStackStatus({ emu, apiHealth, web });

  if (ready) {
    seedAuthIfNeeded();
    openBrowserTabs();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
