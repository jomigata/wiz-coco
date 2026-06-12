/**
 * 내담자–상담사 연결 (Firestore 직접)
 * 정적 Hosting(output: export)에서는 Next.js /api/verify-counselor-code 라우트가 없습니다.
 */
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

export interface CounselorConnection {
  isConnected: boolean;
  counselorId?: string;
  counselorCode?: string;
  counselorInfo?: {
    name?: string;
    email?: string;
    specialization?: string[];
  };
  assignedAt?: string;
  sharedData?: {
    testResults: boolean;
    chatHistory: boolean;
    dailyRecords: boolean;
    otherMaterials: boolean;
  };
  isSelfConnection?: boolean;
}

export interface ConnectCounselorResult {
  relationId: string;
  counselorId: string;
  counselorCode: string;
  counselorInfo?: CounselorConnection['counselorInfo'];
  isSelfConnection: boolean;
}

function getDbOrThrow() {
  const { db } = initializeFirebase();
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
  return db;
}

async function findActiveCounselorCode(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const db = getDbOrThrow();

  const byNumberQuery = query(
    collection(db, 'counselorCodes'),
    where('codeNumber', '==', trimmed),
    where('isActive', '==', true),
  );
  const byNumberSnap = await getDocs(byNumberQuery);
  if (!byNumberSnap.empty) return byNumberSnap.docs[0];

  const byNameQuery = query(
    collection(db, 'counselorCodes'),
    where('codeName', '==', trimmed),
    where('isActive', '==', true),
  );
  const byNameSnap = await getDocs(byNameQuery);
  if (!byNameSnap.empty) return byNameSnap.docs[0];

  return null;
}

async function fetchCounselorInfo(counselorId: string): Promise<CounselorConnection['counselorInfo']> {
  const db = getDbOrThrow();
  const counselorQuery = query(collection(db, 'counselors'), where('id', '==', counselorId));
  const counselorSnapshot = await getDocs(counselorQuery);
  if (counselorSnapshot.empty) return undefined;
  const c = counselorSnapshot.docs[0].data();
  return {
    name: c.name as string | undefined,
    email: c.email as string | undefined,
    specialization: c.specialization as string[] | undefined,
  };
}

/** 인증코드(8자리 코드번호 또는 코드명)로 상담사 연결 — 상담사 셀프연결(clientId === counselorId) 허용 */
export async function connectCounselorByCode(
  clientId: string,
  codeInput: string,
): Promise<ConnectCounselorResult> {
  const trimmed = codeInput.trim();
  if (!trimmed) {
    throw new Error('상담사 인증코드를 입력해주세요.');
  }

  const codeDoc = await findActiveCounselorCode(trimmed);
  if (!codeDoc) {
    throw new Error('유효하지 않은 인증코드입니다. 코드번호(8자리) 또는 코드명을 확인해주세요.');
  }

  const codeData = codeDoc.data();
  const counselorId = String(codeData.counselorId || '');
  if (!counselorId) {
    throw new Error('인증코드 정보가 올바르지 않습니다.');
  }

  const isSelfConnection = clientId === counselorId;
  const storedCode = String(codeData.codeNumber || trimmed);
  const db = getDbOrThrow();

  const existingRelationQuery = query(
    collection(db, 'clientCounselorRelations'),
    where('clientId', '==', clientId),
    where('counselorId', '==', counselorId),
    where('isActive', '==', true),
  );
  const existingRelationSnapshot = await getDocs(existingRelationQuery);
  if (!existingRelationSnapshot.empty) {
    throw new Error(
      isSelfConnection
        ? '이미 본인 상담사 계정과 셀프 연결되어 있습니다.'
        : '이미 해당 상담사와 연결되어 있습니다.',
    );
  }

  const relationRef = await addDoc(collection(db, 'clientCounselorRelations'), {
    clientId,
    counselorId,
    counselorCode: storedCode,
    assignedAt: new Date().toISOString(),
    isActive: true,
    isSelfConnection,
    sharedData: {
      testResults: true,
      chatHistory: true,
      dailyRecords: true,
      otherMaterials: true,
    },
  });

  const counselorInfo = await fetchCounselorInfo(counselorId);

  return {
    relationId: relationRef.id,
    counselorId,
    counselorCode: storedCode,
    counselorInfo,
    isSelfConnection,
  };
}

export async function fetchCounselorConnection(clientId: string): Promise<CounselorConnection> {
  const { db } = initializeFirebase();
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const relationQuery = query(
    collection(db, 'clientCounselorRelations'),
    where('clientId', '==', clientId),
    where('isActive', '==', true),
  );
  const relationSnapshot = await getDocs(relationQuery);

  if (relationSnapshot.empty) {
    return { isConnected: false };
  }

  const relationDoc = relationSnapshot.docs[0];
  const relation = relationDoc.data();
  const counselorId = String(relation.counselorId || '');
  const isSelfConnection = Boolean(relation.isSelfConnection) || counselorId === clientId;

  let counselorInfo: CounselorConnection['counselorInfo'];
  if (counselorId) {
    const counselorQuery = query(collection(db, 'counselors'), where('id', '==', counselorId));
    const counselorSnapshot = await getDocs(counselorQuery);
    if (!counselorSnapshot.empty) {
      const c = counselorSnapshot.docs[0].data();
      counselorInfo = {
        name: c.name as string | undefined,
        email: c.email as string | undefined,
        specialization: c.specialization as string[] | undefined,
      };
    }
  }

  return {
    isConnected: true,
    counselorId,
    counselorCode: relation.counselorCode as string | undefined,
    counselorInfo,
    assignedAt: relation.assignedAt as string | undefined,
    sharedData: relation.sharedData as CounselorConnection['sharedData'],
    isSelfConnection,
  };
}
