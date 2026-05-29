/**
 * 내담자–상담사 연결 상태 (Firestore 직접 조회)
 * 정적 Hosting에서는 /api/verify-counselor-code Next 라우트가 없으므로 클라이언트에서 조회합니다.
 */
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  };
}
