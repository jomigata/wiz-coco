#!/usr/bin/env node
/**
 * Auth + Firestore Emulator — 디스크 영속 (.firebase/emulator-data)
 * - 시작: 기존 export 가 있으면 --import
 * - 종료: 명시 export 후 --export-on-exit (Ctrl+C·강제 종료 대비)
 * - 실행 중: 주기 export + Flask API 변경 시 debounce export
 */
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { importDirAbs, importDirRel, runFirebaseExport } = require('./lib/emulator-export');

const ROOT = path.resolve(__dirname, '..');
const exportIntervalSec = Math.max(
  30,
  parseInt(process.env.DEV_EMULATOR_EXPORT_INTERVAL_SEC || '60', 10) || 60,
);

const isWin = process.platform === 'win32';
const firebaseJs = path.join(ROOT, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');

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
  runFirebaseExport('startup');
  exportTimer = setInterval(() => {
    if (!shuttingDown) runFirebaseExport('interval');
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
  console.log(`\n[emulator-persist] ${signal} — saving emulator snapshot…`);
  runFirebaseExport('shutdown');
  if (child && !child.killed) {
    if (isWin) {
      child.kill('SIGINT');
    } else {
      child.kill('SIGINT');
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
if (isWin) {
  process.on('SIGBREAK', () => shutdown('SIGBREAK'));
}

child.on('exit', (code) => process.exit(code ?? 1));
