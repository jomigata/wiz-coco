#!/usr/bin/env node
/**
 * Firebase Auth Emulator 테스트 계정 생성 (Emulator 재시작 후 1회 실행)
 * 사용: npm run dev:seed-auth
 */
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const DEFAULT_PASSWORD = process.env.DEV_EMULATOR_PASSWORD || 'wizcoco1';

const ACCOUNTS = [
  { email: 'jomigata@gmail.com', note: 'bootstrap admin (backend BOOTSTRAP_ADMIN_EMAILS)' },
  { email: 'jomigata@naver.com', note: '로컬 상담사 테스트용 (role은 등록·승인 또는 BOOTSTRAP_COUNSELOR_EMAILS)' },
];

async function signUp(email, password) {
  const url = `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, email };
  if (data?.error?.message === 'EMAIL_EXISTS') return { ok: true, email, exists: true };
  return { ok: false, email, error: data?.error?.message || res.statusText };
}

async function main() {
  console.log(`Auth Emulator: ${AUTH_EMULATOR}`);
  console.log(`Password (all accounts): ${DEFAULT_PASSWORD}\n`);
  let failed = false;
  for (const { email, note } of ACCOUNTS) {
    const result = await signUp(email, DEFAULT_PASSWORD);
    if (result.ok) {
      console.log(`✓ ${email}${result.exists ? ' (already exists)' : ''} — ${note}`);
    } else {
      failed = true;
      console.error(`✗ ${email}: ${result.error}`);
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
