/**
 * 통합 심리 검사 코드 생성 시스템 테스트 (DB 연결 불필요)
 * 
 * 테스트 범위:
 * 1. 코드 형식 검증
 * 2. 코드 파싱
 * 3. 테스트 유형 결정
 * 4. 접두사 매핑
 * 5. 에러 처리
 */

// Jest 환경에서 window 객체 모킹
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/tests/mbti_pro'
  },
  writable: true
});

const { 
  validateCodeFormat, 
  parseTestCode, 
  determineTestType,
  TEST_TYPE_PREFIXES 
} = require('../src/utils/unifiedTestCodeGenerator');

describe('통합 코드 생성 시스템 테스트 (클라이언트 기능)', () => {
  
  describe('코드 형식 검증', () => {
    test('올바른 형식의 코드를 검증한다', () => {
      const validCodes = [
        'MP250-AA001',
        'MG251-BC123',
        'MA250-ZZ999',
        'EP250-AA001A',
        'EA251-BC123AB',
        'EG250-ZZ999ABC'
      ];
      
      validCodes.forEach(code => {
        expect(validateCodeFormat(code)).toBe(true);
      });
    });
    
    test('잘못된 형식의 코드를 거부한다', () => {
      const invalidCodes = [
        'MP25-AA001',      // 년도 1자리
        'MP250AA001',      // 하이픈 누락
        'MP250-A001',      // 알파벳 1자리
        'MP250-AA01',      // 숫자 2자리
        'XY250-AA001',     // 잘못된 접두사
        'mp250-aa001',     // 소문자
        'MP250-AA001-',    // 끝에 하이픈
        ''                 // 빈 문자열
      ];
      
      // 각 코드를 개별적으로 테스트하여 어떤 코드가 문제인지 확인
      invalidCodes.forEach(code => {
        const result = validateCodeFormat(code);
        if (result) {
          console.log(`예상과 다르게 유효한 것으로 판정된 코드: ${code}`);
        }
        expect(result).toBe(false);
      });
    });
  });
  
  describe('코드 파싱', () => {
    test('올바른 코드를 파싱한다', () => {
      const code = 'MP250-BC123A';
      const parsed = parseTestCode(code);
      
      expect(parsed).toEqual({
        prefix: 'MP',
        year: 25,  // 실제 파싱 결과에 맞게 수정 (50 -> 25)
        sequence: 0,
        alphabet: 'BC',
        number: 123,
        extension: 'A'
      });
    });
    
    test('확장 문자가 없는 코드를 파싱한다', () => {
      const code = 'MG251-AA001';
      const parsed = parseTestCode(code);
      
      expect(parsed).toEqual({
        prefix: 'MG',
        year: 25,  // 실제 파싱 결과에 맞게 수정 (51 -> 25)
        sequence: 1,
        alphabet: 'AA',
        number: 1,
        extension: undefined  // 빈 문자열 대신 undefined
      });
    });
    
    test('잘못된 코드는 null을 반환한다', () => {
      const invalidCode = 'INVALID-CODE';
      const parsed = parseTestCode(invalidCode);
      
      expect(parsed).toBeNull();
    });
  });
  
  describe('테스트 유형 결정', () => {
    test('경로에 따라 올바른 테스트 유형을 결정한다', () => {
      const testCases = [
        { pathname: '/tests/mbti_pro', expected: 'PROFESSIONAL' },
        { pathname: '/tests/mbti', expected: 'AMATEUR' },
        { pathname: '/tests/ego-ok', expected: 'EGO_AMATEUR' },
        { pathname: '/tests/enneagram', expected: 'ENNEAGRAM_AMATEUR' },
        { pathname: '/unknown', expected: 'AMATEUR' }
      ];
      
      testCases.forEach(({ pathname, expected }) => {
        const result = determineTestType(pathname);
        expect(result).toBe(expected);
      });
    });
  });
  
  describe('접두사 매핑', () => {
    test('모든 테스트 유형에 대한 접두사가 정의되어 있다', () => {
      const expectedPrefixes = {
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
      
      expect(TEST_TYPE_PREFIXES).toEqual(expectedPrefixes);
    });
    
    test('모든 접두사가 2자리 대문자이다', () => {
      Object.values(TEST_TYPE_PREFIXES).forEach(prefix => {
        expect(prefix).toMatch(/^[A-Z]{2}$/);
      });
    });
  });
  
  describe('코드 생성 규칙 검증', () => {
    test('생성된 코드가 문서화된 규칙을 따른다', () => {
      // 실제 코드 생성은 서버 환경에서만 가능하므로
      // 여기서는 형식 규칙만 검증
      const sampleCode = 'MP250-AA001';
      const parsed = parseTestCode(sampleCode);
      
      expect(parsed).not.toBeNull();
      expect(parsed.prefix).toBe('MP');
      expect(parsed.year).toBe(25); // 실제 파싱 결과에 맞게 수정 (50 -> 25)
      expect(parsed.sequence).toBeGreaterThanOrEqual(0);
      expect(parsed.sequence).toBeLessThan(10);
      expect(parsed.alphabet).toMatch(/^[A-Z]{2}$/);
      expect(parsed.number).toBeGreaterThanOrEqual(0);
      expect(parsed.number).toBeLessThan(1000);
    });
  });
  
  describe('에러 처리', () => {
    test('null 또는 undefined 입력을 안전하게 처리한다', () => {
      expect(validateCodeFormat(null)).toBe(false);
      expect(validateCodeFormat(undefined)).toBe(false);
      expect(parseTestCode(null)).toBeNull();
      expect(parseTestCode(undefined)).toBeNull();
    });
    
    test('빈 문자열을 안전하게 처리한다', () => {
      expect(validateCodeFormat('')).toBe(false);
      expect(parseTestCode('')).toBeNull();
    });
  });
});

describe('성능 테스트', () => {
  test('코드 검증이 빠르게 수행된다', () => {
    const codes = Array.from({ length: 1000 }, (_, i) => `MP250-AA${String(i).padStart(3, '0')}`);
    
    const startTime = Date.now();
    codes.forEach(code => validateCodeFormat(code));
    const endTime = Date.now();
    
    // 1000개 코드 검증이 100ms 이내에 완료되어야 함
    expect(endTime - startTime).toBeLessThan(100);
  });
  
  test('코드 파싱이 빠르게 수행된다', () => {
    const codes = Array.from({ length: 1000 }, (_, i) => `MP250-AA${String(i).padStart(3, '0')}`);
    
    const startTime = Date.now();
    codes.forEach(code => parseTestCode(code));
    const endTime = Date.now();
    
    // 1000개 코드 파싱이 200ms 이내에 완료되어야 함
    expect(endTime - startTime).toBeLessThan(200);
  });
});

describe('통합 테스트', () => {
  test('전체 워크플로우가 일관성 있게 동작한다', () => {
    // 1. 테스트 유형 결정
    const testType = determineTestType('/tests/mbti_pro');
    expect(testType).toBe('PROFESSIONAL');
    
    // 2. 접두사 확인
    const prefix = TEST_TYPE_PREFIXES[testType];
    expect(prefix).toBe('MP');
    
    // 3. 샘플 코드 생성 (형식만)
    const year = new Date().getFullYear() % 100;
    const sampleCode = `${prefix}${String(year).padStart(2, '0')}0-AA001`;
    
    // 4. 코드 검증
    expect(validateCodeFormat(sampleCode)).toBe(true);
    
    // 5. 코드 파싱
    const parsed = parseTestCode(sampleCode);
    expect(parsed).not.toBeNull();
    expect(parsed.prefix).toBe(prefix);
  });
});

describe('폴백 시스템 테스트', () => {
  test('다양한 코드 형식을 올바르게 검증한다', () => {
    // 폴백 코드 형식들
    const fallbackCodes = [
      'MP259-FB797',     // DB 폴백 코드
      'MA258-LF123ABC',  // 로컬 폴백 코드
      'MG250-AA001A',    // 확장 문자 포함
      'EP251-ZZ999'      // 최대값 근처
    ];
    
    fallbackCodes.forEach(code => {
      expect(validateCodeFormat(code)).toBe(true);
      const parsed = parseTestCode(code);
      expect(parsed).not.toBeNull();
    });
  });
  
  test('코드 파싱이 모든 구성 요소를 올바르게 추출한다', () => {
    const testCases = [
      {
        code: 'MP250-AA001',
        expected: { prefix: 'MP', year: 25, sequence: 0, alphabet: 'AA', number: 1, extension: undefined }
      },
      {
        code: 'MG259-FB797',
        expected: { prefix: 'MG', year: 25, sequence: 9, alphabet: 'FB', number: 797, extension: undefined }
      },
      {
        code: 'EA251-BC123ABC',
        expected: { prefix: 'EA', year: 25, sequence: 1, alphabet: 'BC', number: 123, extension: 'ABC' }
      }
    ];
    
    testCases.forEach(({ code, expected }) => {
      const parsed = parseTestCode(code);
      expect(parsed).toEqual(expected);
    });
  });
}); 