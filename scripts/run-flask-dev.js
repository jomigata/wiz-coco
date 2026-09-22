#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'backend');
const isWin = process.platform === 'win32';
const venvPython = path.join(
  backendDir,
  '.venv',
  isWin ? 'Scripts/python.exe' : 'bin/python',
);

dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(backendDir, '.env.smtp.local'), override: true });

const env = {
  ...process.env,
  USE_FIREBASE_EMULATOR: 'true',
  /** Solapi/SMS만 스킵 — SMTP 이메일은 backend/.env.smtp.local 설정 시 실발송 */
  COST_SAVER_MODE: 'true',
  FLASK_ENV: 'development',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_PROJECT_ID: 'wiz-coco',
};

const child = spawn(venvPython, ['app.py'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
  shell: false,
  windowsHide: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
