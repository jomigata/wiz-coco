/**
 * 심리 검사 결과 코드 생성 유틸리티
 * 
 * 코드 형식: 접두사 + 년도(2자리) + 시퀀스(1자리) + "-" + 알파벳(2자리) + 숫자(3자리) + 확장문자(선택적)
 * 예시: MP250-AA001, MG251-BC123A, MI250-AA001
 */

export interface TestCodeInfo {
  prefix: string;
  year: string;
  sequence: number;
  alphabet: string;
  number: number;
  extension?: string;
}

export interface LastCodeData {
  sequence: number;
  alphabet: string;
  number: number;
  extension?: string;
}

// 검사 유형별 접두사 - 문서 규칙에 따라 업데이트
export const TEST_PREFIXES = {
  PROFESSIONAL: 'MP', // 전문가용 MBTI 검사 (MBTI Pro)
  GROUP: 'MG',        // 그룹형 MBTI 검사
  AMATEUR: 'MA',      // 개인용 MBTI 검사 (일반 개인 검사)
  INSIDE_MBTI: 'MI',  // 인사이드 MBTI 검사
  EGO_PROFESSIONAL: 'EP', // 전문가용 이고-오케이 검사
  EGO_AMATEUR: 'EA',      // 개인용 이고-오케이 검사
  EGO_GROUP: 'EG',        // 그룹형 이고-오케이 검사
  ENNEAGRAM_PROFESSIONAL: 'AP', // 전문가용 에니어그램 검사
  ENNEAGRAM_AMATEUR: 'AA',      // 개인용 에니어그램 검사
  ENNEAGRAM_GROUP: 'AG'         // 그룹형 에니어그램 검사
} as const;

export type TestPrefix = typeof TEST_PREFIXES[keyof typeof TEST_PREFIXES];

/**
 * 알파벳 코드를 다음 순서로 증가시킴 (AA → AB → AC → ... → AZ → BA → ... → ZZ)
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
      return 'AA'; // AA로 리셋 (시퀀스가 증가해야 함)
    }
  }

  return String.fromCharCode(first) + String.fromCharCode(second);
}

/**
 * 확장 문자를 증가시킴 (A → B → ... → Z → AA → AB → ...)
 */
function incrementExtension(current?: string): string {
  if (!current) return 'A';
  
  if (current.length === 1) {
    if (current === 'Z') return 'AA';
    return String.fromCharCode(current.charCodeAt(0) + 1);
  }
  
  // 2자리 이상인 경우
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
    // 모든 자리가 Z였던 경우 (예: ZZ → AAA)
    return 'A'.repeat(chars.length + 1);
  }
  
  return chars.join('');
}

/**
 * 마지막 코드 정보를 로컬 스토리지에서 가져옴
 * 실제 운영 환경에서는 데이터베이스의 ResultCodeSequence 테이블에서 조회해야 함
 */
function getLastCodeData(testType: string, year: string): LastCodeData {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage 접근 불가, 기본값 사용');
      return {
        sequence: 0,
        alphabet: 'AA',
        number: 0
      };
    }

    const key = `test-code-sequence-${testType}-${year}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log(`[testCodeGenerator] 마지막 코드 데이터 로드: ${testType}-${year} -> ${JSON.stringify(parsed)}`);
        return parsed;
      } catch (e) {
        console.error('마지막 코드 데이터 파싱 오류:', e);
      }
    }
    
    // 기본값
    const defaultData = {
      sequence: 0,
      alphabet: 'AA',
      number: 0
    };
    console.log(`[testCodeGenerator] 기본 코드 데이터 사용: ${JSON.stringify(defaultData)}`);
    return defaultData;
  } catch (error) {
    console.error('[testCodeGenerator] 마지막 코드 데이터 조회 중 오류:', error);
    return {
      sequence: 0,
      alphabet: 'AA',
      number: 0
    };
  }
}

/**
 * 마지막 코드 정보를 로컬 스토리지에 저장
 * 실제 운영 환경에서는 데이터베이스의 ResultCodeSequence 테이블을 업데이트해야 함
 */
function saveLastCodeData(testType: string, year: string, data: LastCodeData): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage 접근 불가, 코드 데이터 저장 건너뜀');
      return;
    }

    const key = `test-code-sequence-${testType}-${year}`;
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[testCodeGenerator] 마지막 코드 데이터 저장: ${testType}-${year} -> ${JSON.stringify(data)}`);
  } catch (error) {
    console.error('[testCodeGenerator] 마지막 코드 데이터 저장 중 오류:', error);
  }
}

/**
 * 기존 테스트 코드와 중복되는지 확인
 */
function isCodeDuplicate(code: string): boolean {
  try {
    // 로컬 스토리지의 test_records 확인
    const testRecords = localStorage.getItem('test_records');
    if (testRecords) {
      try {
        const records = JSON.parse(testRecords);
        if (Array.isArray(records) && records.some(record => record.code === code || record.resultCode === code)) {
          return true;
        }
      } catch (e) {
        console.error('테스트 기록 확인 오류:', e);
      }
    }

    // 사용자별 검사 기록 확인
    try {
      const userEmail = localStorage.getItem('user');
      if (userEmail) {
        const userData = JSON.parse(userEmail);
        const userSpecificKey = `test-user-records-${userData.email}`;
        const userRecords = localStorage.getItem(userSpecificKey);
        if (userRecords) {
          const records = JSON.parse(userRecords);
          if (Array.isArray(records) && records.some(record => record.code === code || record.resultCode === code)) {
            return true;
          }
        }
      }
    } catch (e) {
      console.error('사용자 검사 기록 확인 오류:', e);
    }

    // 테스트 결과 파일 존재 여부 확인
    const resultKey = `test-result-${code}`;
    if (localStorage.getItem(resultKey)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('코드 중복 확인 중 오류:', error);
    return false; // 에러 발생 시 중복되지 않은 것으로 처리
  }
}

/**
 * 다음 코드 생성 (규칙에 따른 증가)
 */
function generateNextCode(prefix: TestPrefix, lastData: LastCodeData, year: string): { code: string; newData: LastCodeData } {
  let newData = { ...lastData };
  
  // 1. 숫자 코드 증가
  newData.number++;
  
  // 2. 숫자 오버플로우 처리 (999 → 000)
  if (newData.number >= 1000) {
    newData.number = 0;
    
    // 3. 알파벳 코드 증가
    const nextAlphabet = incrementAlphabet(newData.alphabet);
    if (nextAlphabet === 'AA' && newData.alphabet === 'ZZ') {
      // 4. 알파벳 오버플로우 (ZZ → AA)
      newData.alphabet = 'AA';
      newData.sequence++;
      
      // 5. 시퀀스 오버플로우 처리 (9 → 0)
      if (newData.sequence >= 10) {
        newData.sequence = 0;
        newData.extension = incrementExtension(newData.extension);
      }
    } else {
      newData.alphabet = nextAlphabet;
    }
  }
  
  const code = formatCode(prefix, year, newData);
  return { code, newData };
}

/**
 * 코드 포맷팅
 */
function formatCode(prefix: TestPrefix, year: string, data: LastCodeData): string {
  const numericPart = data.number.toString().padStart(3, '0');
  const extension = data.extension || '';
  return `${prefix}${year}${data.sequence}-${data.alphabet}${numericPart}${extension}`;
}

/**
 * 검사 코드 생성 메인 함수
 */
export function generateTestCode(testType: 'PROFESSIONAL' | 'GROUP' | 'AMATEUR' | 'INSIDE_MBTI' | 'EGO_PROFESSIONAL' | 'EGO_AMATEUR' | 'EGO_GROUP' | 'ENNEAGRAM_PROFESSIONAL' | 'ENNEAGRAM_AMATEUR' | 'ENNEAGRAM_GROUP'): string {
  try {
    const prefix = TEST_PREFIXES[testType];
    const currentYear = new Date().getFullYear();
    const year = currentYear.toString().slice(-2);
    
    console.log(`[testCodeGenerator] 코드 생성 시작: ${testType} (${prefix})`);
    
    // 현재 시퀀스 정보 조회
    const lastData = getLastCodeData(prefix, year);
    
    // 중복 방지를 위한 최대 시도 횟수
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const { code, newData } = generateNextCode(prefix, lastData, year);
      
      // 중복 확인
      if (!isCodeDuplicate(code)) {
        // 새로운 시퀀스 정보 저장
        saveLastCodeData(prefix, year, newData);
        
        console.log(`[testCodeGenerator] 코드 생성 완료: ${code} (시도 횟수: ${attempts + 1})`);
        return code;
      }
      
      // 중복된 경우 다음 코드로 진행
      Object.assign(lastData, newData);
      attempts++;
      
      console.warn(`[testCodeGenerator] 중복 코드 발견: ${code}, 다음 코드 시도 중... (${attempts}/${maxAttempts})`);
    }
    
    // 최대 시도 횟수 초과 시 타임스탬프 기반 백업 코드 생성
    const timestamp = Date.now().toString().slice(-6);
    const backupCode = `${prefix}${year}9-ZZ${timestamp.slice(-3)}`;
    
    console.error(`[testCodeGenerator] 최대 시도 횟수 초과, 백업 코드 생성: ${backupCode}`);
    return backupCode;
    
  } catch (error) {
    console.error('[testCodeGenerator] 코드 생성 중 오류:', error);
    
    // 최종 백업 코드 생성
    const prefix = TEST_PREFIXES[testType] || 'XX';
    const year = new Date().getFullYear().toString().slice(-2);
    const timestamp = Date.now().toString().slice(-6);
    const emergencyCode = `${prefix}${year}9-ZZ${timestamp.slice(-3)}`;
    
    console.error(`[testCodeGenerator] 응급 코드 생성: ${emergencyCode}`);
    return emergencyCode;
  }
}

/**
 * 검사 코드 파싱
 */
export function parseTestCode(code: string): TestCodeInfo | null {
  try {
    // 형식: MP250-AA001 또는 MP250-AA001A
    const match = code.match(/^([A-Z]{2})(\d{2})(\d)-([A-Z]{2})(\d{3})([A-Z]*)$/);
    
    if (!match) {
      return null;
    }
    
    return {
      prefix: match[1],
      year: match[2],
      sequence: parseInt(match[3]),
      alphabet: match[4],
      number: parseInt(match[5]),
      extension: match[6] || undefined
    };
  } catch (error) {
    console.error('코드 파싱 오류:', error);
    return null;
  }
}

/**
 * 검사 코드 유효성 검사
 */
export function isValidTestCode(code: string): boolean {
  return parseTestCode(code) !== null;
} 