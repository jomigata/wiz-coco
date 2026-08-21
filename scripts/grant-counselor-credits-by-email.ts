/**
 * 상담사 이메일로 검사 크레딧 지급 (Firestore 직접)
 *
 * npx tsx scripts/grant-counselor-credits-by-email.ts jomiga@naver.com jomigata@naver.com --amount 100000
 */
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

const USERS_COLLECTION = 'users';
const COUNSELOR_CREDITS_COLLECTION = 'counselorCredits';
const COUNSELOR_CREDIT_LEDGER_COLLECTION = 'counselorCreditLedger';

async function getDb() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  const mod = await import('../src/lib/firebase-admin.ts');
  if (!mod.adminDb) {
    throw new Error('Firebase Admin DB 초기화 실패 — FIREBASE_ADMIN_* 또는 GOOGLE_APPLICATION_CREDENTIALS 확인');
  }
  return mod.adminDb;
}

async function resolveCounselorUid(email: string): Promise<{ uid: string; role: string }> {
  const normalized = email.trim().toLowerCase();
  const auth = getAuth();
  const user = await auth.getUserByEmail(normalized);
  const db = await getDb();
  const snap = await db.collection(USERS_COLLECTION).doc(user.uid).get();
  if (!snap.exists) {
    throw new Error(`Firestore users 문서 없음 (${normalized})`);
  }
  const role = String(snap.data()?.role || '');
  if (role !== 'counselor' && role !== 'admin') {
    throw new Error(`상담사/admin 역할이 아님 (${normalized}, role=${role})`);
  }
  return { uid: user.uid, role };
}

async function getBalance(db: Firestore, uid: string): Promise<number> {
  const snap = await db.collection(COUNSELOR_CREDITS_COLLECTION).doc(uid).get();
  if (!snap.exists) return 0;
  const raw = snap.data()?.balance;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

async function grantCredits(
  db: Firestore,
  uid: string,
  amount: number,
  email: string,
  role: string,
): Promise<number> {
  const ref = db.collection(COUNSELOR_CREDITS_COLLECTION).doc(uid);
  const before = await getBalance(db, uid);
  const after = before + amount;
  await ref.set(
    {
      counselorUid: uid,
      balance: after,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await db.collection(COUNSELOR_CREDIT_LEDGER_COLLECTION).add({
    counselorUid: uid,
    delta: amount,
    balanceAfter: after,
    reason: 'admin_grant',
    actorUid: 'admin_script',
    metadata: { source: 'grant_counselor_credits_by_email', email, role },
    createdAt: FieldValue.serverTimestamp(),
  });
  return after;
}

async function main() {
  const args = process.argv.slice(2);
  let amount = 100000;
  const emails: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--amount' && args[i + 1]) {
      amount = Number(args[i + 1]);
      i += 1;
      continue;
    }
    emails.push(args[i]);
  }
  if (!emails.length) {
    console.error('Usage: npx tsx scripts/grant-counselor-credits-by-email.ts <email...> [--amount N]');
    process.exit(1);
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    console.error('amount must be 1..100000');
    process.exit(1);
  }

  const db = await getDb();
  let failed = 0;
  for (const email of emails) {
    try {
      const { uid, role } = await resolveCounselorUid(email);
      const before = await getBalance(db, uid);
      const after = await grantCredits(db, uid, amount, email.trim().toLowerCase(), role);
      console.log(`OK ${email} uid=${uid} role=${role} before=${before} granted=${amount} after=${after}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${email}:`, err instanceof Error ? err.message : err);
    }
  }
  process.exit(failed ? 1 : 0);
}

void main();
