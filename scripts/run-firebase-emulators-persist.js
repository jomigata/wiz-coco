#!/usr/bin/env node
/**
 * Auth + Firestore Emulator — 종료 시 export, 재시작 시 import (.firebase/emulator-data)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const importDir = path.join('.firebase', 'emulator-data');
const args = [
  'emulators:start',
  '--only',
  'auth,firestore',
  '--project',
  'wiz-coco',
  '--export-on-exit',
  importDir,
];

if (fs.existsSync(importDir)) {
  args.push('--import', importDir);
}

const child = spawn('firebase', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 1));
