#!/usr/bin/env node
/**
 * Auth + Firestore Emulator — 디스크 영속 (.firebase/emulator-data)
 * - 시작: 기존 export 가 있으면 --import
 * - 종료: --export-on-exit (Ctrl+C 등 정상 종료)
 * - 실행 중: 주기 export (재부팅·강제 종료 후에도 마지막 스냅샷 복원)
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
/** repo 루트 기준 상대 경로 (경로 공백 시 firebase CLI 인자 깨짐 방지) */
const importDirRel = path.join('.firebase', 'emulator-data');
const importDirAbs = path.join(ROOT, importDirRel);
const exportIntervalSec = Math.max(
  30,
  parseInt(process.env.DEV_EMULATOR_EXPORT_INTERVAL_SEC || '120', 10) || 120,
);

const isWin = process.platform === 'win32';
const firebaseJs = path.join(ROOT, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');

function runFirebase(args, inherit = true) {
  return spawnSync(process.execPath, [firebaseJs, ...args], {
    cwd: ROOT,
    stdio: inherit ? 'inherit' : 'pipe',
    shell: false,
    windowsHide: true,
  });
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

function runExport(label) {
  fs.mkdirSync(path.dirname(importDirAbs), { recursive: true });
  const r = runFirebase(['emulators:export', importDirRel, '--project', 'wiz-coco', '--force']);
  if (r.status === 0) {
    console.log(`[emulator-persist] ✓ export (${label}) → ${importDirRel}`);
  } else {
    console.warn(`[emulator-persist] export skipped/failed (${label})`);
  }
}

const args = [
  'emulators:start',
  '--only',
  'auth,firestore',
  '--project',
  'wiz-coco',
  '--export-on-exit',
  importDirRel,
];

if (fs.existsSync(importDirAbs)) {
  args.push('--import', importDirRel);
  console.log(`[emulator-persist] import → ${importDirRel}`);
} else {
  console.log(`[emulator-persist] no prior export — empty emulator (data will be saved here)`);
}

const child = spawn(process.execPath, [firebaseJs, ...args], {
  stdio: 'inherit',
  shell: false,
  cwd: ROOT,
  windowsHide: true,
});

let exportTimer = null;
let shuttingDown = false;

async function startPeriodicExport() {
  const ready = await portOpen(8080);
  if (!ready || shuttingDown) return;
  runExport('startup');
  exportTimer = setInterval(() => {
    if (!shuttingDown) runExport('interval');
  }, exportIntervalSec * 1000);
  console.log(
    `[emulator-persist] auto-export every ${exportIntervalSec}s (DEV_EMULATOR_EXPORT_INTERVAL_SEC)`,
  );
}

startPeriodicExport().catch((err) => console.warn('[emulator-persist]', err.message));

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (exportTimer) clearInterval(exportTimer);
  console.log(`\n[emulator-persist] ${signal} — waiting for export-on-exit…`);
  if (child && !child.killed) {
    child.kill(isWin ? undefined : 'SIGINT');
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
if (isWin) {
  process.on('SIGBREAK', () => shutdown('SIGBREAK'));
}

child.on('exit', (code) => process.exit(code ?? 1));
