/**
 * Firebase 기반 테스트 코드 생성기 - 더미 구현
 * 
 * 주요 특징:
 * - Firebase Firestore 기반 코드 생성
 * - 동시성 제어를 위한 Firebase 트랜잭션
 * - 클라이언트/서버 환경 모두 지원
 * - 폴백 모드 지원
 */

// 서버 환경 체크
const isServer = typeof window === 'undefined';

// Firebase 관련 import (클라이언트에서만)
let db: any = null;
let firebaseAvailable = false;

if (!isServer) {
  try {
    // 클라이언트 환경에서 Firebase 초기화
    const { getFirestore } = require('firebase/firestore');
    const { getApp } = require('firebase/app');
    
    try {
      const app = getApp();
      db = getFirestore(app);
      firebaseAvailable = true;
      console.log('[Firebase코드생성] Firebase 클라이언트 초기화 성공');
    } catch (firebaseError) {
      console.warn('[Firebase코드생성] Firebase 클라이언트 초기화 실패:', firebaseError);
      firebaseAvailable = false;
    }
  } catch (error) {
    console.warn('[Firebase코드생성] Firebase 의존성 로딩 실패:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// 검사 유형별 접두사 매핑
export const DB_TEST_PREFIXES = {
  PROFESSIONAL: 'MP',
  GROUP: 'MG', 
  AMATEUR: 'MA',
  EGO_PROFESSIONAL: 'EP',
  EGO_AMATEUR: 'EA',
  EGO_GROUP: 'EG',
  ENNEAGRAM_PROFESSIONAL: 'AP',
  ENNEAGRAM_AMATEUR: 'AA',
  ENNEAGRAM_GROUP: 'AG'
} as const;

export type DBTestType = keyof typeof DB_TEST_PREFIXES;

export interface DBTestCodeInfo {
  code: string;
  testType: DBTestType;
  generatedAt: Date;
  attempt: number;
  metadata: {
    year: number;
    sequence: number;
    alphabet: string;
    number: number;
    extension?: string;
  };
}

export interface CodeGenerationRequest {
  testType: DBTestType;
  userId?: string;
  clientInfo: {
    ip: string;
    userAgent: string;
    timestamp: number;
  };
}

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  message: string;
  metadata?: DBTestCodeInfo['metadata'];
  error?: string;
}

/**
 * Firebase 환경 확인 헬퍼
 */
function ensureFirebaseEnvironment(): boolean {
  if (!firebaseAvailable) {
    console.warn('[Firebase코드생성] Firebase 연결이 사용 불가능합니다. 폴백 모드로 실행됩니다.');
    return false;
  }
  
  return true;
}

/**
 * 폴백 코드 생성 (Firebase 연결 실패 시)
 */
function generateFallbackCode(testType: DBTestType): CodeGenerationResult {
  try {
    const prefix = DB_TEST_PREFIXES[testType];
    const year = new Date().getFullYear() % 100;
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    // 폴백 코드 형식: 접두사 + 년도 + 9 + "-" + "FB" + 타임스탬프 + 랜덤문자
    const fallbackCode = `${prefix}${year.toString().padStart(2, '0')}9-FB${timestamp.slice(-3)}${randomSuffix}`;
    
    console.log(`[Firebase코드생성] 폴백 코드 생성: ${fallbackCode}`);
    
    return {
      success: true,
      code: fallbackCode,
      message: '폴백 모드로 코드가 생성되었습니다.',
      metadata: {
        year,
        sequence: 9,
        alphabet: 'FB',
        number: parseInt(timestamp.slice(-3)),
        extension: randomSuffix
      }
    };
  } catch (error) {
    console.error('[Firebase코드생성] 폴백 코드 생성 실패:', error);
    return {
      success: false,
      message: '코드 생성에 실패했습니다.',
      error: 'FALLBACK_GENERATION_FAILED'
    };
  }
}

/**
 * 알파벳 시퀀스 증가 (AA → AB → AC → ... → AZ → BA → ... → ZZ)
 */
function incrementAlphabet(current: string): string {
  const chars = current.split('');
  let first = chars[0].charCodeAt(0);
  let second = chars[1].charCodeAt(0);

  second++;
  if (second > 90) { // Z를 넘어가면
    second = 65; // A로 초기화
    first++;
    if (first > 90) { // 첫 번째도 Z를 넘어가면
      return 'AA'; // AA로 리셋 (오버플로우 신호)
    }
  }

  return String.fromCharCode(first) + String.fromCharCode(second);
}

/**
 * 확장 문자 증가 (A → B → ... → Z → AA → AB → ...)
 */
function incrementExtension(current?: string): string {
  if (!current) return 'A';
  
  if (current.length === 1) {
    if (current === 'Z') return 'AA';
    return String.fromCharCode(current.charCodeAt(0) + 1);
  }
  
  const chars = current.split('');
  let lastIndex = chars.length - 1;
  
  while (lastIndex >= 0) {
    if (chars[lastIndex] === 'Z') {
      chars[lastIndex] = 'A';
      lastIndex--;
    } else {
      chars[lastIndex] = String.fromCharCode(chars[lastIndex].charCodeAt(0) + 1);
      break;
    }
  }
  
  if (lastIndex < 0) {
    return 'A'.repeat(chars.length + 1);
  }
  
  return chars.join('');
}

/**
 * Firebase 기반 안전한 코드 생성
 */
export async function generateTestCodeWithLock(
  request: CodeGenerationRequest
): Promise<CodeGenerationResult> {
  // Firebase 환경 확인
  if (!ensureFirebaseEnvironment()) {
    console.warn('[Firebase코드생성] Firebase 연결 실패, 폴백 코드 생성 시도');
    return generateFallbackCode(request.testType);
  }

  try {
    console.log(`[Firebase코드생성] ${request.testType} 유형 코드 생성 시작`);
    
    // 실제 코드 생성 로직 실행
    const result = await generateUniqueTestCodeFirebase(request);
    
    console.log(`[Firebase코드생성] 코드 생성 완료: ${result.code || 'FAILED'}`);
    return result;
    
  } catch (error) {
    console.error('[Firebase코드생성] 코드 생성 중 오류:', error);
    
    // 오류 발생 시 폴백 코드 생성 시도
    console.warn('[Firebase코드생성] 오류로 인한 폴백 코드 생성 시도');
    return generateFallbackCode(request.testType);
  }
}

/**
 * Firebase 기반 고유 테스트 코드 생성 (트랜잭션 보장)
 */
async function generateUniqueTestCodeFirebase(
  request: CodeGenerationRequest
): Promise<CodeGenerationResult> {
  // Firebase 환경 확인
  if (!ensureFirebaseEnvironment()) {
    return generateFallbackCode(request.testType);
  }

  const { testType, userId, clientInfo } = request;
  const prefix = DB_TEST_PREFIXES[testType];
  const year = new Date().getFullYear() % 100;
  const maxAttempts = 10;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      // Firebase 트랜잭션으로 원자적 코드 생성
      const { runTransaction, doc, getDoc, setDoc, collection } = require('firebase/firestore');
      
      const result = await runTransaction(db, async (transaction: any) => {
        console.log(`[Firebase코드생성] 트랜잭션 시도 #${attempt} - ${testType}`);
        
        // 1. 현재 시퀀스 조회
        const sequenceRef = doc(db, 'testCodeSequences', `${testType}_${year}`);
        const sequenceDoc = await transaction.get(sequenceRef);
        
        let currentSeq = 0;
        let currentAlphabet = 'AA';
        let currentNumber = 0;
        let currentExtension: string | null = null;
        
        if (!sequenceDoc.exists()) {
          // 새로운 시퀀스 생성
          currentNumber = 1;
          console.log(`[Firebase코드생성] 새 시퀀스 생성: ${testType}-${year}`);
        } else {
          // 기존 시퀀스 업데이트
          const seq = sequenceDoc.data();
          currentSeq = seq.currentSequence || 0;
          currentAlphabet = seq.currentAlphabet || 'AA';
          currentNumber = (seq.currentNumber || 0) + 1;
          currentExtension = seq.currentExtension || null;
          
          // 숫자 오버플로우 체크 (≥1000)
          if (currentNumber >= 1000) {
            currentNumber = 0;
            const newAlphabet = incrementAlphabet(currentAlphabet);
            
            // 알파벳 오버플로우 체크 (ZZ → AA)
            if (newAlphabet === 'AA' && currentAlphabet === 'ZZ') {
              currentSeq++;
              currentAlphabet = 'AA';
              
              // 시퀀스 오버플로우 체크 (≥10)
              if (currentSeq >= 10) {
                currentSeq = 0;
                currentExtension = incrementExtension(currentExtension || undefined);
              }
            } else {
              currentAlphabet = newAlphabet;
            }
          }
          
          console.log(`[Firebase코드생성] 시퀀스 업데이트: seq=${currentSeq}, alp=${currentAlphabet}, num=${currentNumber}, ext=${currentExtension}`);
        }
        
        // 2. 코드 생성
        const numberStr = currentNumber.toString().padStart(3, '0');
        const baseCode = `${prefix}${year.toString().padStart(2, '0')}${currentSeq}-${currentAlphabet}${numberStr}`;
        const generatedCode = currentExtension ? `${baseCode}${currentExtension}` : baseCode;
        
        console.log(`[Firebase코드생성] 생성된 코드: ${generatedCode}`);
        
        // 3. 중복 검사
        const testResultRef = doc(db, 'testResults', generatedCode);
        const existingDoc = await transaction.get(testResultRef);
        
        if (existingDoc.exists()) {
          console.warn(`[Firebase코드생성] 중복 코드 발견: ${generatedCode}`);
          
          // 중복 로그 기록
          const logRef = doc(collection(db, 'testCodeGenerationLogs'));
          transaction.set(logRef, {
            generatedCode,
            testType,
            clientIp: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            isDuplicate: true,
            userId: request.userId || null,
            timestamp: new Date()
          });
          
          throw new Error('DUPLICATE_CODE'); // 트랜잭션 롤백하고 재시도
        }
        
        // 4. 시퀀스 업데이트
        transaction.set(sequenceRef, {
          testType,
          year,
          currentSequence: currentSeq,
          currentAlphabet,
          currentNumber,
          currentExtension,
          updatedAt: new Date()
        });
        
        // 5. 성공 로그 기록
        const logRef = doc(collection(db, 'testCodeGenerationLogs'));
        transaction.set(logRef, {
          generatedCode,
          testType,
          clientIp: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          isDuplicate: false,
          userId: request.userId || null,
          timestamp: new Date()
        });
        
        return {
          code: generatedCode,
          metadata: {
            year,
            sequence: currentSeq,
            alphabet: currentAlphabet,
            number: currentNumber,
            extension: currentExtension || undefined
          }
        };
      });
      
      console.log(`[Firebase코드생성] 성공: ${result.code} (시도 횟수: ${attempt})`);
      
      return {
        success: true,
        code: result.code,
        message: '코드 생성 성공',
        metadata: result.metadata
      };
      
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_CODE') {
        console.warn(`[Firebase코드생성] 중복으로 인한 재시도 #${attempt}`);
        continue; // 재시도
      }
      
      console.error(`[Firebase코드생성] 트랜잭션 실패 #${attempt}:`, error);
      
      // 최대 시도 횟수에 도달하지 않았으면 재시도
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // 지수 백오프
        continue;
      }
      
      throw error; // 최대 시도 횟수 초과 시 에러 발생
    }
  }
  
  // 최대 시도 횟수 초과
  console.error(`[Firebase코드생성] 최대 시도 횟수 초과: ${maxAttempts}`);
  return {
    success: false,
    message: `코드 생성 실패: 최대 시도 횟수(${maxAttempts}) 초과`,
    error: 'MAX_ATTEMPTS_EXCEEDED'
  };
}

/**
 * 코드 검증
 */
export async function validateTestCode(code: string): Promise<{
  isValid: boolean;
  isUsed: boolean;
  testType?: string;
  generatedAt?: Date;
}> {
  // Firebase 환경 확인
  if (!ensureFirebaseEnvironment()) {
    // Firebase 연결 실패 시 기본 형식 검증만 수행
    const pattern = /^(MP|MG|MA|EP|EA|EG|AP|AA|AG)(\d{2})(\d)-([A-Z]{2})(\d{3})([A-Z]*)$/;
    return {
      isValid: pattern.test(code),
      isUsed: false
    };
  }

  try {
    console.log(`[Firebase코드검증] 코드 검증 시작: ${code}`);
    
    // 코드 형식 검증
    const pattern = /^(MP|MG|MA|EP|EA|EG|AP|AA|AG)(\d{2})(\d)-([A-Z]{2})(\d{3})([A-Z]*)$/;
    if (!pattern.test(code)) {
      console.log(`[Firebase코드검증] 형식 불일치: ${code}`);
      return {
        isValid: false,
        isUsed: false
      };
    }
    
    // Firebase에서 사용 여부 확인
    const { doc, getDoc } = require('firebase/firestore');
    const testResultRef = doc(db, 'testResults', code);
    const testResultDoc = await getDoc(testResultRef);
    
    if (testResultDoc.exists()) {
      const data = testResultDoc.data();
      console.log(`[Firebase코드검증] 사용된 코드: ${code}`);
      return {
        isValid: true,
        isUsed: true,
        testType: data.testType,
        generatedAt: data.createdAt?.toDate()
      };
    }
    
    console.log(`[Firebase코드검증] 사용 가능한 코드: ${code}`);
    return {
      isValid: true,
      isUsed: false
    };
    
  } catch (error) {
    console.error('[Firebase코드검증] 검증 중 오류:', error);
    // 오류 시 기본 형식 검증만 수행
    const pattern = /^(MP|MG|MA|EP|EA|EG|AP|AA|AG)(\d{2})(\d)-([A-Z]{2})(\d{3})([A-Z]*)$/;
    return {
      isValid: pattern.test(code),
      isUsed: false
    };
  }
}

/**
 * 캐시된 시퀀스 조회 (성능 최적화)
 */
export async function getCachedSequence(testType: DBTestType, year: number) {
  // Firebase 환경 확인
  if (!ensureFirebaseEnvironment()) {
    return null;
  }

  try {
    const { doc, getDoc } = require('firebase/firestore');
    const sequenceRef = doc(db, 'testCodeSequences', `${testType}_${year}`);
    const sequenceDoc = await getDoc(sequenceRef);
    
    if (sequenceDoc.exists()) {
      return sequenceDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('[Firebase캐시] 시퀀스 조회 중 오류:', error);
    return null;
  }
}

/**
 * 코드 생성 통계 조회
 */
export async function getCodeGenerationStats(): Promise<{
  totalGenerated: number;
  duplicatesDetected: number;
  averageGenerationTime: number;
  concurrentRequests: number;
  failureRate: number;
}> {
  // Firebase 환경 확인
  if (!ensureFirebaseEnvironment()) {
    return {
      totalGenerated: 0,
      duplicatesDetected: 0,
      averageGenerationTime: 0,
      concurrentRequests: 0,
      failureRate: 0
    };
  }

  try {
    const { collection, query, where, getDocs, orderBy, limit } = require('firebase/firestore');
    
    // 최근 1시간 데이터 조회
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const logsRef = collection(db, 'testCodeGenerationLogs');
    const q = query(
      logsRef,
      where('timestamp', '>=', oneHourAgo),
      orderBy('timestamp', 'desc')
    );
    
         const querySnapshot = await getDocs(q);
     const logs = querySnapshot.docs.map((doc: any) => doc.data());
     
     const totalGenerated = logs.length;
     const duplicatesDetected = logs.filter((log: any) => log.isDuplicate).length;
     const failureRate = totalGenerated > 0 ? duplicatesDetected / totalGenerated : 0;
     
     return {
       totalGenerated,
       duplicatesDetected,
       averageGenerationTime: 0, // Firebase에서는 계산 복잡
       concurrentRequests: logs.filter((log: any) => 
         log.timestamp?.toDate() > new Date(Date.now() - 60 * 1000)
       ).length,
      failureRate
    };
  } catch (error) {
    console.error('[Firebase통계] 통계 조회 중 오류:', error);
    return {
      totalGenerated: 0,
      duplicatesDetected: 0,
      averageGenerationTime: 0,
      concurrentRequests: 0,
      failureRate: 0
    };
  }
}

/**
 * 중복 발생률 모니터링 및 알림
 */
export async function checkDuplicateRate(): Promise<void> {
  // Firebase 환경 확인
  if (!ensureFirebaseEnvironment()) {
    return;
  }

  try {
    const stats = await getCodeGenerationStats();
    const duplicateRate = stats.duplicatesDetected / stats.totalGenerated || 0;
    
    if (duplicateRate > 0.05) { // 5% 이상
      console.warn(`[Firebase모니터링] 높은 중복 발생률 감지: ${(duplicateRate * 100).toFixed(2)}%`);
      
      // 여기에 알림 시스템 연동 (Slack, 이메일 등)
      // await sendAlert({
      //   type: 'HIGH_DUPLICATE_RATE',
      //   message: `코드 중복 발생률이 ${(duplicateRate * 100).toFixed(2)}%입니다.`,
      //   severity: 'WARNING'
      // });
    }
  } catch (error) {
    console.error('[Firebase모니터링] 모니터링 중 오류:', error);
  }
}

/**
 * 리소스 정리
 */
export async function cleanup(): Promise<void> {
  console.log('[Firebase코드생성] 리소스 정리 완료');
}

// 프로세스 종료 시 리소스 정리 (서버 환경에서만)
if (isServer) {
  process.on('beforeExit', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
} 