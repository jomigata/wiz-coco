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

const smtpEnvKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'MAIL_FROM',
  'COUNSELOR_ADMIN_NOTIFY_EMAIL',
];

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
for (const key of smtpEnvKeys) {
  if (process.env[key]) env[key] = process.env[key];
}

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
  console.log('[dev:flask] SMTP email send enabled:', env.SMTP_USER);
} else {
  console.warn('[dev:flask] SMTP not configured — copy backend/.env.smtp.local.example');
}

const child = spawn(venvPython, ['app.py'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
  shell: false,
  windowsHide: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
