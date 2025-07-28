// Firebase Firestore 유틸리티
// 데이터베이스 CRUD 작업 및 쿼리 기능 제공

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  runTransaction,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * 문서 ID로 단일 문서 조회
 * @param collectionName - 컬렉션 이름
 * @param docId - 문서 ID
 * @returns Promise<DocumentData | null>
 */
export async function getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
  try {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('문서 조회 실패:', error);
    throw new Error('문서를 조회할 수 없습니다.');
  }
}

/**
 * 컬렉션의 모든 문서 조회
 * @param collectionName - 컬렉션 이름
 * @returns Promise<DocumentData[]>
 */
export async function getDocuments(collectionName: string): Promise<DocumentData[]> {
  try {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('문서 목록 조회 실패:', error);
    throw new Error('문서 목록을 조회할 수 없습니다.');
  }
}

/**
 * 조건부 쿼리로 문서 조회
 * @param collectionName - 컬렉션 이름
 * @param conditions - 쿼리 조건 배열
 * @param orderByField - 정렬 필드 (선택사항)
 * @param orderDirection - 정렬 방향 (선택사항)
 * @param limitCount - 조회 제한 개수 (선택사항)
 * @returns Promise<DocumentData[]>
 */
export async function queryDocuments(
  collectionName: string,
  conditions: Array<{ field: string; operator: any; value: any }> = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  limitCount?: number
): Promise<DocumentData[]> {
  try {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    let q = query(collection(db, collectionName));
    
    // 조건 추가
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    // 정렬 추가
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // 제한 추가
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('쿼리 조회 실패:', error);
    throw new Error('쿼리 결과를 조회할 수 없습니다.');
  }
}

/**
 * 새 문서 추가
 * @param collectionName - 컬렉션 이름
 * @param data - 추가할 데이터
 * @returns Promise<string> - 생성된 문서 ID
 */
export async function addDocument(collectionName: string, data: any): Promise<string> {
  try {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('문서 추가 실패:', error);
    throw new Error('문서를 추가할 수 없습니다.');
  }
}

/**
 * 문서 업데이트
 * @param collectionName - 컬렉션 이름
 * @param docId - 문서 ID
 * @param data - 업데이트할 데이터
 * @returns Promise<void>
 */
export async function updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('문서 업데이트 실패:', error);
    throw new Error('문서를 업데이트할 수 없습니다.');
  }
}

/**
 * 문서 삭제
 * @param collectionName - 컬렉션 이름
 * @param docId - 문서 ID
 * @returns Promise<void>
 */
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('문서 삭제 실패:', error);
    throw new Error('문서를 삭제할 수 없습니다.');
  }
}

/**
 * 배치 작업으로 여러 문서 처리
 * @param operations - 배치 작업 배열
 * @returns Promise<void>
 */
export async function batchOperation(operations: Array<{
  type: 'add' | 'update' | 'delete';
  collectionName: string;
  docId?: string;
  data?: any;
}>): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(operation => {
      if (operation.type === 'add') {
        const docRef = doc(collection(db, operation.collectionName));
        batch.set(docRef, {
          ...operation.data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      } else if (operation.type === 'update' && operation.docId) {
        const docRef = doc(db, operation.collectionName, operation.docId);
        batch.update(docRef, {
          ...operation.data,
          updatedAt: Timestamp.now()
        });
      } else if (operation.type === 'delete' && operation.docId) {
        const docRef = doc(db, operation.collectionName, operation.docId);
        batch.delete(docRef);
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error('배치 작업 실패:', error);
    throw new Error('배치 작업을 수행할 수 없습니다.');
  }
}

/**
 * 트랜잭션으로 데이터 처리
 * @param updateFunction - 트랜잭션 함수
 * @returns Promise<T>
 */
export async function runFirestoreTransaction<T>(
  updateFunction: (transaction: any) => Promise<T>
): Promise<T> {
  try {
    return await runTransaction(db, updateFunction);
  } catch (error) {
    console.error('트랜잭션 실패:', error);
    throw new Error('트랜잭션을 수행할 수 없습니다.');
  }
}

/**
 * 실시간 리스너 설정
 * @param collectionName - 컬렉션 이름
 * @param callback - 콜백 함수
 * @param conditions - 쿼리 조건 (선택사항)
 * @returns () => void - 구독 해제 함수
 */
export function subscribeToCollection(
  collectionName: string,
  callback: (docs: DocumentData[]) => void,
  conditions: Array<{ field: string; operator: any; value: any }> = []
): () => void {
  let q = query(collection(db, collectionName));
  
  // 조건 추가
  conditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(docs);
  });
  
  return unsubscribe;
}

// 테스트 결과 관련 특화 함수들
export const testResultUtils = {
  /**
   * 테스트 결과 저장
   * @param testResult - 테스트 결과 데이터
   * @returns Promise<string> - 저장된 문서 ID
   */
  async saveTestResult(testResult: any): Promise<string> {
    return addDocument('test_results', {
      ...testResult,
      testDate: Timestamp.now()
    });
  },

  /**
   * 사용자의 테스트 결과 조회
   * @param userId - 사용자 ID
   * @returns Promise<DocumentData[]>
   */
  async getUserTestResults(userId: string): Promise<DocumentData[]> {
    return queryDocuments('test_results', [
      { field: 'userId', operator: '==', value: userId }
    ], 'testDate', 'desc');
  },

  /**
   * 테스트 코드로 결과 조회
   * @param testCode - 테스트 코드
   * @returns Promise<DocumentData | null>
   */
  async getTestResultByCode(testCode: string): Promise<DocumentData | null> {
    const results = await queryDocuments('test_results', [
      { field: 'code', operator: '==', value: testCode }
    ]);
    return results.length > 0 ? results[0] : null;
  }
}; 