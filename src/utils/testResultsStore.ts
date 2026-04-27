import { initializeFirebase } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export type StoredTestResult = {
  /** Firebase Auth UID (로그인 사용자만 저장) */
  uid: string;
  /** 표시용 (선택) */
  email?: string | null;
  /** 로컬 test_records의 code */
  code: string;
  /** 표시용 검사 타입/이름 */
  testType: string;
  /** 결과 데이터(선택) */
  resultData?: unknown;
  /** 원본 userData/메타(선택) */
  userData?: unknown;
  /** 상담사 연결(선택) */
  counselorId?: string;
  counselorCode?: string;
  /** 할당 기반이면 연결(선택) */
  assignmentId?: string;
  /** 상태 */
  status?: 'completed' | 'in-progress';
};

/**
 * 로그인된 사용자 검사 결과를 Firestore 전역 컬렉션 `testResults`에 저장한다.
 * - 비로그인 상태면 저장하지 않음 (로컬 test_records만 유지)
 * - 생성 시각은 serverTimestamp로 기록
 */
export async function saveUserTestResultToFirestore(input: Omit<StoredTestResult, 'uid'>) {
  const { auth, db } = initializeFirebase();
  const u = auth?.currentUser;
  if (!db || !u?.uid) return { ok: false as const, skipped: true as const };

  const payload: StoredTestResult & { createdAt: any; updatedAt: any } = {
    uid: u.uid,
    email: u.email,
    status: 'completed',
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'testResults'), payload);
  return { ok: true as const, id: ref.id };
}

