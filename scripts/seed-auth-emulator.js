#!/usr/bin/env node
/**
 * Firebase Auth Emulator 테스트 계정 생성·비밀번호 동기화
 * - .env.local 의 DEV_EMULATOR_ADMIN_PASSWORD / DEV_EMULATOR_PASSWORD 사용 (git 제외)
 * - 기존 계정이 있으면 signIn + accounts:update 로 비밀번호 맞춤
 * 사용: npm run dev:seed-auth
 */
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config({ path: path.join(ROOT, '.env') });

const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const DEFAULT_PASSWORD = process.env.DEV_EMULATOR_PASSWORD || 'wizcoco1';
const ADMIN_PASSWORD = process.env.DEV_EMULATOR_ADMIN_PASSWORD || DEFAULT_PASSWORD;

const ACCOUNTS = [
  {
    email: 'jomigata@gmail.com',
    password: ADMIN_PASSWORD,
    note: 'bootstrap admin (backend BOOTSTRAP_ADMIN_EMAILS)',
  },
  {
    email: 'jomigata@naver.com',
    password: DEFAULT_PASSWORD,
    note: '로컬 상담사 테스트용 (role은 등록·승인 또는 BOOTSTRAP_COUNSELOR_EMAILS)',
    optional: true,
  },
];

async function signUp(email, password) {
  const url = `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, email, created: true };
  if (data?.error?.message === 'EMAIL_EXISTS') return { ok: false, email, exists: true };
  return { ok: false, email, error: data?.error?.message || res.statusText };
}

async function signInWithPassword(email, password) {
  const url = `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data.idToken || null;
}

async function updatePassword(idToken, password) {
  const url = `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, password, returnSecureToken: true }),
  });
  return res.ok;
}

async function syncPassword(email, targetPassword, fallbackPasswords = []) {
  const candidates = [...new Set([targetPassword, ...fallbackPasswords, DEFAULT_PASSWORD, 'wizcoco1'])];
  for (const pw of candidates) {
    const idToken = await signInWithPassword(email, pw);
    if (!idToken) continue;
    if (pw === targetPassword) return true;
    return updatePassword(idToken, targetPassword);
  }
  return false;
}

async function upsertAccount(email, password, fallbackPasswords = []) {
  let result = await signUp(email, password);
  if (result.ok) return result;
  if (!result.exists) return result;
  const synced = await syncPassword(email, password, fallbackPasswords);
  if (synced) return { ok: true, email, reset: true };
  return { ok: false, email, error: 'EMAIL_EXISTS (could not sync password — Emulator UI에서 계정 삭제 후 재시도)' };
}

async function main() {
  console.log(`Auth Emulator: ${AUTH_EMULATOR}`);
  console.log('Passwords loaded from .env.local (DEV_EMULATOR_ADMIN_PASSWORD / DEV_EMULATOR_PASSWORD)\n');
  let failed = false;
  for (const { email, password, note, optional } of ACCOUNTS) {
    const fallbacks = email.includes('gmail.com') ? [ADMIN_PASSWORD] : [];
    const result = await upsertAccount(email, password, fallbacks);
    if (result.ok) {
      const tag = result.reset ? ' (password synced)' : result.created ? '' : '';
      console.log(`✓ ${email}${tag} — ${note}`);
    } else if (optional) {
      console.warn(`⚠ ${email}: ${result.error || 'skipped'}`);
    } else {
      failed = true;
      console.error(`✗ ${email}: ${result.error || 'unknown error'}`);
    }
  }
  if (failed) {
    console.error('\nEmulator가 떠 있는지 확인하세요 (npm run dev).');
    process.exit(1);
  }
  console.log('\n로그인: http://localhost:3000/login');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
