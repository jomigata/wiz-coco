/**
 * 상담사 인증코드 CRUD (Firestore 클라이언트)
 * 정적 Hosting(output: export)에서는 Next.js /api/counselor-codes 라우트가 없습니다.
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { CounselorCode } from '@/types/counselor';

const COLLECTION = 'counselorCodes';

function getDb() {
  const { db } = initializeFirebase();
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
  return db;
}

function mapDoc(id: string, data: Record<string, unknown>): CounselorCode {
  return {
    id,
    counselorId: String(data.counselorId ?? ''),
    codeName: String(data.codeName ?? ''),
    codeNumber: String(data.codeNumber ?? ''),
    isActive: Boolean(data.isActive),
    createdAt: String(data.createdAt ?? ''),
    expiresAt: data.expiresAt ? String(data.expiresAt) : undefined,
  };
}

export async function fetchCounselorCodes(counselorId: string): Promise<CounselorCode[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), where('counselorId', '==', counselorId));
  const snapshot = await getDocs(q);
  const codes = snapshot.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
  return codes.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function isCodeNameTaken(codeName: string, excludeId?: string): Promise<boolean> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('codeName', '==', codeName),
    where('isActive', '==', true),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  if (excludeId && snapshot.docs.every((d) => d.id === excludeId)) return false;
  return snapshot.docs.some((d) => d.id !== excludeId);
}

function generateCodeNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export async function createCounselorCode(
  counselorId: string,
  codeName: string,
): Promise<CounselorCode> {
  const trimmed = codeName.trim();
  if (!trimmed) throw new Error('코드명을 입력해주세요.');

  if (await isCodeNameTaken(trimmed)) {
    throw new Error('이미 사용 중인 코드명입니다.');
  }

  const db = getDb();
  const counselorCode: Omit<CounselorCode, 'id'> = {
    counselorId,
    codeName: trimmed,
    codeNumber: generateCodeNumber(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), counselorCode);
  return { id: docRef.id, ...counselorCode };
}

export async function updateCounselorCodeName(codeId: string, codeName: string): Promise<void> {
  const trimmed = codeName.trim();
  if (!trimmed) throw new Error('코드명을 입력해주세요.');

  if (await isCodeNameTaken(trimmed, codeId)) {
    throw new Error('이미 사용 중인 코드명입니다.');
  }

  const db = getDb();
  await updateDoc(doc(db, COLLECTION, codeId), {
    codeName: trimmed,
    updatedAt: new Date().toISOString(),
  });
}

export async function deactivateCounselorCode(codeId: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, codeId), {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });
}

export async function activateCounselorCode(codeId: string, codeName: string): Promise<void> {
  const trimmed = codeName.trim();
  if (!trimmed) throw new Error('코드명을 입력해주세요.');

  if (await isCodeNameTaken(trimmed, codeId)) {
    throw new Error('이미 사용 중인 코드명입니다. 다른 상담사가 동일한 활성 코드명을 사용 중입니다.');
  }

  const db = getDb();
  await updateDoc(doc(db, COLLECTION, codeId), {
    isActive: true,
    updatedAt: new Date().toISOString(),
  });
}
