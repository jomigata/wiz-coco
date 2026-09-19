#!/usr/bin/env node
/**
 * 1회 로컬 풀스택 설정: Python venv, Flask deps, .env.local / backend/.env
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'backend');
const venvDir = path.join(backendDir, '.venv');
const isWin = process.platform === 'win32';
const python = process.env.PYTHON || (isWin ? 'python' : 'python3');

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(dest)) {
    console.log(`✓ ${label} already exists: ${path.relative(root, dest)}`);
    return;
  }
  if (!fs.existsSync(src)) {
    console.warn(`⚠ Skip ${label}: missing template ${path.relative(root, src)}`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Created ${path.relative(root, dest)} from template`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
    ...opts,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

console.log('=== WizCoCo local stack setup ===\n');

const javaCheck = spawnSync('java', ['-version'], {
  encoding: 'utf8',
  shell: false,
  windowsHide: true,
});
if (javaCheck.error || javaCheck.status !== 0) {
  console.error('❌ Java JDK 11+ 가 필요합니다 (Firestore Emulator).');
  console.error('   설치: winget install --id Microsoft.OpenJDK.17 -e');
  console.error('   설치 후 터미널을 다시 열고 npm run setup:local 을 실행하세요.\n');
  process.exit(1);
}
const javaOut = `${javaCheck.stderr || ''}${javaCheck.stdout || ''}`;
console.log(`✓ Java: ${javaOut.split('\n')[0] || 'ok'}\n`);

if (!fs.existsSync(venvDir)) {
  console.log('Creating Python venv...');
  run(python, ['-m', 'venv', venvDir]);
} else {
  console.log('✓ Python venv exists');
}

const pip = path.join(venvDir, isWin ? 'Scripts/pip.exe' : 'bin/pip');
const req = path.join(backendDir, 'requirements.txt');
if (fs.existsSync(req)) {
  console.log('Installing Flask dependencies...');
  run(pip, ['install', '-r', req]);
}

copyIfMissing(path.join(root, '.env.local.example'), path.join(root, '.env.local'), '.env.local');
copyIfMissing(
  path.join(backendDir, '.env.local.example'),
  path.join(backendDir, '.env'),
  'backend/.env',
);

console.log('\nOptional: prod Firestore 데이터가 필요하면 backend/.env 에');
console.log('FIREBASE_CREDENTIALS_PATH=../Firebase_GitHub/<service-account>.json');
console.log('USE_FIREBASE_EMULATOR=false 로 바꾸세요 (GCP 읽기/쓰기 과금).\n');

console.log('Next: npm install   (concurrently, firebase-tools)');
console.log('Then: npm run dev\n');
console.log('URLs: http://localhost:3000  |  API http://localhost:5000  |  Emulator UI http://localhost:4000');
