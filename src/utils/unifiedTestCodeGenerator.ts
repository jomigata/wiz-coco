/**
 * 통합 심리 검사 코드 생성 유틸리티
 * 클라이언트와 서버 환경 모두 지원
 * 
 * 사용법:
 * - 서버 환경: DB 기반 코드 생성 (동시성 안전)
 * - 클라이언트 환경: API 호출을 통한 코드 생성
 * - 폴백: 로컬 기반 코드 생성 (DB/API 실패 시)
 */

import { DBTestType, generateTestCodeWithLock, CodeGenerationRequest } from './dbTestCodeGenerator';

// 로컬 폴백 코드 생성 함수
function generateLocalFallbackCode(testType: DBTestType): string {
  const prefixes = {
    PROFESSIONAL: 'MP',
    GROUP: 'MG', 
    AMATEUR: 'MA',
    EGO_PROFESSIONAL: 'EP',
    EGO_AMATEUR: 'EA',
    EGO_GROUP: 'EG',
    ENNEAGRAM_PROFESSIONAL: 'AP',
    ENNEAGRAM_AMATEUR: 'AA',
    ENNEAGRAM_GROUP: 'AG'
  };
  
  const prefix = prefixes[testType];
  const year = new Date().getFullYear() % 100;
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  // 로컬 폴백 코드 형식: 접두사 + 년도 + 8 + "-" + "LF" + 타임스탬프 + 랜덤문자
  const fallbackCode = `${prefix}${year.toString().padStart(2, '0')}8-LF${timestamp.slice(-3)}${randomSuffix}`;
  
  console.log(`[통합코드생성] 로컬 폴백 코드 생성: ${fallbackCode}`);
  return fallbackCode;
}

// 클라이언트 환경에서 사용할 API 기반 코드 생성
async function generateCodeViaAPI(testType: DBTestType, userId?: string): Promise<{
  success: boolean;
  code?: string;
  message: string;
  error?: string;
}> {
  try {
    console.log(`[통합코드생성] API를 통한 코드 생성 요청: ${testType}`);
    
    const response = await fetch('/api/test-codes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType,
        userId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`[통합코드생성] API 코드 생성 성공: ${result.code}`);
    } else {
      console.warn(`[통합코드생성] API 코드 생성 실패: ${result.message}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('[통합코드생성] API 호출 중 오류:', error);
    
    // API 실패 시 로컬 폴백 코드 생성
    const fallbackCode = generateLocalFallbackCode(testType);
    
    return {
      success: true,
      code: fallbackCode,
      message: 'API 실패로 인한 로컬 폴백 코드가 생성되었습니다.',
      error: error instanceof Error ? error.message : 'NETWORK_ERROR'
    };
  }
}

/**
 * 환경에 따라 적절한 방법으로 코드 생성
 */
export async function generateUnifiedTestCode(
  testType: DBTestType, 
  userId?: string
): Promise<{
  success: boolean;
  code?: string;
  message: string;
  error?: string;
}> {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // 서버 환경: DB 기반 코드 생성
    try {
      console.log(`[통합코드생성] 서버 환경에서 DB 기반 코드 생성: ${testType}`);
      
      const request: CodeGenerationRequest = {
        testType,
        userId,
        clientInfo: {
          ip: 'server-internal',
          userAgent: 'Server-Internal-Request',
          timestamp: Date.now()
        }
      };
      
      const result = await generateTestCodeWithLock(request);
      
      if (result.success) {
        console.log(`[통합코드생성] 서버 코드 생성 성공: ${result.code}`);
      } else {
        console.warn(`[통합코드생성] 서버 코드 생성 실패: ${result.message}`);
        
        // 서버에서 DB 실패 시 로컬 폴백 시도
        if (result.error === 'CLIENT_ENVIRONMENT_NOT_SUPPORTED' || 
            result.error === 'FALLBACK_GENERATION_FAILED') {
          const fallbackCode = generateLocalFallbackCode(testType);
          return {
            success: true,
            code: fallbackCode,
            message: '서버 DB 실패로 인한 로컬 폴백 코드가 생성되었습니다.',
            error: result.error
          };
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('[통합코드생성] 서버 코드 생성 중 오류:', error);
      
      // 서버 오류 시 로컬 폴백 코드 생성
      const fallbackCode = generateLocalFallbackCode(testType);
      
      return {
        success: true,
        code: fallbackCode,
        message: '서버 오류로 인한 로컬 폴백 코드가 생성되었습니다.',
        error: error instanceof Error ? error.message : 'SERVER_ERROR'
      };
    }
  } else {
    // 클라이언트 환경: API 호출 (폴백 포함)
    console.log(`[통합코드생성] 클라이언트 환경에서 API 호출: ${testType}`);
    return await generateCodeViaAPI(testType, userId);
  }
}

/**
 * 검사 유형별 접두사 매핑 (클라이언트용)
 */
export const TEST_TYPE_PREFIXES = {
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

/**
 * 코드 형식 검증
 */
export function validateCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // 기본 형식: 접두사(2) + 년도(2) + 시퀀스(1) + "-" + 알파벳(2) + 숫자(3) + 확장문자(선택)
  const pattern = /^[A-Z]{2}\d{2}\d-[A-Z]{2}\d{3}[A-Z]*$/;
  
  if (!pattern.test(code)) {
    return false;
  }
  
  // 유효한 접두사 확인
  const prefix = code.substring(0, 2);
  const validPrefixes = Object.values(TEST_TYPE_PREFIXES);
  
  return validPrefixes.includes(prefix as any);
}

/**
 * 코드에서 정보 추출
 */
export function parseTestCode(code: string): {
  prefix: string;
  year: number;
  sequence: number;
  alphabet: string;
  number: number;
  extension?: string;
} | null {
  if (!validateCodeFormat(code)) {
    return null;
  }
  
  try {
    const match = code.match(/^([A-Z]{2})(\d{2})(\d)-([A-Z]{2})(\d{3})([A-Z]*)$/);
    if (!match) return null;
    
    return {
      prefix: match[1],
      year: parseInt(match[2], 10),
      sequence: parseInt(match[3], 10),
      alphabet: match[4],
      number: parseInt(match[5], 10),
      extension: match[6] || undefined
    };
  } catch (error) {
    console.error('코드 파싱 오류:', error);
    return null;
  }
}

/**
 * 검사 유형 결정 (URL 경로 기반)
 */
export function determineTestType(pathname?: string): DBTestType {
  if (typeof window !== 'undefined') {
    pathname = pathname || window.location.pathname;
  }
  
  if (!pathname) return 'AMATEUR';
  
  // URL 경로에 따른 검사 유형 결정
  if (pathname.includes('/tests/mbti_pro')) {
    return 'PROFESSIONAL';
  } else if (pathname.includes('/tests/inside-mbti')) {
    return 'AMATEUR'; // 인사이드 MBTI는 개인용으로 분류
  } else if (pathname.includes('/tests/ego-ok')) {
    return 'EGO_AMATEUR';
  } else if (pathname.includes('/tests/enneagram')) {
    return 'ENNEAGRAM_AMATEUR';
  }
  
  // 기본값: 개인용 MBTI
  return 'AMATEUR';
}

/**
 * 그룹 검사 여부 확인
 */
export function isGroupTest(clientInfo?: any): boolean {
  return !!(clientInfo?.groupCode && clientInfo.groupCode.length > 0);
}

/**
 * 편의 함수: 현재 컨텍스트에 맞는 코드 생성
 */
export async function generateContextualTestCode(
  clientInfo?: any,
  userId?: string,
  pathname?: string
): Promise<{
  success: boolean;
  code?: string;
  message: string;
  error?: string;
}> {
  // 검사 유형 결정
  let testType = determineTestType(pathname);
  
  // 그룹 검사인 경우 타입 변경
  if (isGroupTest(clientInfo)) {
    if (testType === 'PROFESSIONAL') {
      testType = 'GROUP';
    } else if (testType === 'EGO_AMATEUR') {
      testType = 'EGO_GROUP';
    } else if (testType === 'ENNEAGRAM_AMATEUR') {
      testType = 'ENNEAGRAM_GROUP';
    } else {
      testType = 'GROUP'; // 기본 그룹형
    }
  }
  
  console.log(`[통합코드생성] 컨텍스트 기반 코드 생성: ${testType} (그룹: ${isGroupTest(clientInfo)})`);
  
  try {
    const result = await generateUnifiedTestCode(testType, userId);
    
    // 결과 검증
    if (result.success && result.code && validateCodeFormat(result.code)) {
      console.log(`[통합코드생성] 컨텍스트 코드 생성 성공: ${result.code}`);
      return result;
    } else if (result.success && result.code) {
      console.warn(`[통합코드생성] 생성된 코드 형식이 올바르지 않음: ${result.code}`);
      // 형식이 잘못된 경우 로컬 폴백 코드 생성
      const fallbackCode = generateLocalFallbackCode(testType);
      return {
        success: true,
        code: fallbackCode,
        message: '코드 형식 오류로 인한 로컬 폴백 코드가 생성되었습니다.',
        error: 'INVALID_CODE_FORMAT'
      };
    } else {
      // 완전 실패 시 로컬 폴백 코드 생성
      const fallbackCode = generateLocalFallbackCode(testType);
      return {
        success: true,
        code: fallbackCode,
        message: '모든 방법 실패로 인한 최종 폴백 코드가 생성되었습니다.',
        error: result.error || 'COMPLETE_FAILURE'
      };
    }
  } catch (error) {
    console.error('[통합코드생성] 컨텍스트 코드 생성 중 예외:', error);
    
    // 예외 발생 시 로컬 폴백 코드 생성
    const fallbackCode = generateLocalFallbackCode(testType);
    return {
      success: true,
      code: fallbackCode,
      message: '예외 발생으로 인한 최종 폴백 코드가 생성되었습니다.',
      error: error instanceof Error ? error.message : 'EXCEPTION_ERROR'
    };
  }
}

// 기본 내보내기
export default {
  generateUnifiedTestCode,
  generateContextualTestCode,
  validateCodeFormat,
  parseTestCode,
  determineTestType,
  isGroupTest,
  TEST_TYPE_PREFIXES
}; 