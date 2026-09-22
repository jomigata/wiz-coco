#!/usr/bin/env node
/** SMTP 로컬 설정 확인 (backend/.env.smtp.local) */
const path = require('path');
const dotenv = require('dotenv');

const backendDir = path.join(__dirname, '..', 'backend');
dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(backendDir, '.env.smtp.local'), override: true });

const host = (process.env.SMTP_HOST || '').trim();
const user = (process.env.SMTP_USER || '').trim();
const pass = (process.env.SMTP_PASSWORD || '').trim();
const from = (process.env.MAIL_FROM || '').trim();

console.log('SMTP local config (backend/.env.smtp.local)');
console.log(`  SMTP_HOST: ${host || '(empty)'}`);
console.log(`  SMTP_USER: ${user || '(empty)'}`);
console.log(`  SMTP_PASSWORD: ${pass ? '*** set ***' : '(empty)'}`);
console.log(`  MAIL_FROM: ${from || '(empty)'}`);
const ok = Boolean(host && user && pass);
console.log(ok ? '\n✓ Email send enabled for local Flask' : '\n✗ Fill SMTP_PASSWORD (Gmail app password) then restart npm run dev');
process.exit(ok ? 0 : 1);
