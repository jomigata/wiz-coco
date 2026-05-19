/**
 * 통합 심리 검사 코드 생성 시스템 테스트 (DB 연결 불필요)
 *
 * 검사결과 코드는 하이픈 없이 저장·표시 (예: MP250AA001).
 * 레거시 하이픈 입력(MP250-AA001)은 정규화 후 동일하게 처리됩니다.
 */

Object.defineProperty(window, 'location', {
  value: {
    pathname: '/tests/mbti_pro',
  },
  writable: true,
});

const {
  validateCodeFormat,
  parseTestCode,
  determineTestType,
  TEST_TYPE_PREFIXES,
} = require('../src/utils/unifiedTestCodeGenerator');

describe('통합 코드 생성 시스템 테스트 (클라이언트 기능)', () => {
  describe('코드 형식 검증', () => {
    test('올바른 형식의 코드를 검증한다', () => {
      const validCodes = [
        'MP250AA001',
        'MG251BC123',
        'MA250ZZ999',
        'EP250AA001A',
        'EA251BC123AB',
        'EG250ZZ999ABC',
        'MP250-AA001', // 레거시 입력: 정규화 후 유효
      ];

      validCodes.forEach((code) => {
        expect(validateCodeFormat(code)).toBe(true);
      });
    });

    test('잘못된 형식의 코드를 거부한다', () => {
      const invalidCodes = [
        'MP25AA001', // 년도 1자리
        'MP250A001', // 알파벳 1자리
        'MP250AA01', // 숫자 2자리
        'XY250AA001', // 잘못된 접두사
        '', // 빈 문자열
      ];

      invalidCodes.forEach((code) => {
        expect(validateCodeFormat(code)).toBe(false);
      });
    });
  });

  describe('코드 파싱', () => {
    test('올바른 코드를 파싱한다', () => {
      const parsed = parseTestCode('MP250BC123A');

      expect(parsed).toEqual({
        prefix: 'MP',
        year: 25,
        sequence: 0,
        alphabet: 'BC',
        number: 123,
        extension: 'A',
      });
    });

    test('확장 문자가 없는 코드를 파싱한다', () => {
      const parsed = parseTestCode('MG251AA001');

      expect(parsed).toEqual({
        prefix: 'MG',
        year: 25,
        sequence: 1,
        alphabet: 'AA',
        number: 1,
        extension: undefined,
      });
    });

    test('레거시 하이픈 입력도 파싱한다', () => {
      const parsed = parseTestCode('MG251-AA001');

      expect(parsed).toEqual({
        prefix: 'MG',
        year: 25,
        sequence: 1,
        alphabet: 'AA',
        number: 1,
        extension: undefined,
      });
    });

    test('잘못된 코드는 null을 반환한다', () => {
      expect(parseTestCode('INVALID-CODE')).toBeNull();
    });
  });

  describe('테스트 유형 결정', () => {
    test('경로에 따라 올바른 테스트 유형을 결정한다', () => {
      const testCases = [
        { pathname: '/tests/mbti_pro', expected: 'PROFESSIONAL' },
        { pathname: '/tests/mbti', expected: 'AMATEUR' },
        { pathname: '/tests/ego-ok', expected: 'EGO_AMATEUR' },
        { pathname: '/tests/enneagram', expected: 'ENNEAGRAM_AMATEUR' },
        { pathname: '/unknown', expected: 'AMATEUR' },
      ];

      testCases.forEach(({ pathname, expected }) => {
        expect(determineTestType(pathname)).toBe(expected);
      });
    });
  });

  describe('접두사 매핑', () => {
    test('모든 테스트 유형에 대한 접두사가 정의되어 있다', () => {
      expect(TEST_TYPE_PREFIXES).toEqual({
        PROFESSIONAL: 'MP',
        GROUP: 'MG',
        AMATEUR: 'MA',
        EGO_PROFESSIONAL: 'EP',
        EGO_AMATEUR: 'EA',
        EGO_GROUP: 'EG',
        ENNEAGRAM_PROFESSIONAL: 'AP',
        ENNEAGRAM_AMATEUR: 'AA',
        ENNEAGRAM_GROUP: 'AG',
      });
    });

    test('모든 접두사가 2자리 대문자이다', () => {
      Object.values(TEST_TYPE_PREFIXES).forEach((prefix) => {
        expect(prefix).toMatch(/^[A-Z]{2}$/);
      });
    });
  });

  describe('코드 생성 규칙 검증', () => {
    test('생성된 코드가 문서화된 규칙을 따른다', () => {
      const parsed = parseTestCode('MP250AA001');

      expect(parsed).not.toBeNull();
      expect(parsed.prefix).toBe('MP');
      expect(parsed.year).toBe(25);
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
    const codes = Array.from(
      { length: 1000 },
      (_, i) => `MP250AA${String(i).padStart(3, '0')}`
    );

    const startTime = Date.now();
    codes.forEach((code) => validateCodeFormat(code));
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  test('코드 파싱이 빠르게 수행된다', () => {
    const codes = Array.from(
      { length: 1000 },
      (_, i) => `MP250AA${String(i).padStart(3, '0')}`
    );

    const startTime = Date.now();
    codes.forEach((code) => parseTestCode(code));
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(200);
  });
});

describe('통합 테스트', () => {
  test('전체 워크플로우가 일관성 있게 동작한다', () => {
    const testType = determineTestType('/tests/mbti_pro');
    expect(testType).toBe('PROFESSIONAL');

    const prefix = TEST_TYPE_PREFIXES[testType];
    expect(prefix).toBe('MP');

    const year = new Date().getFullYear() % 100;
    const sampleCode = `${prefix}${String(year).padStart(2, '0')}0AA001`;

    expect(validateCodeFormat(sampleCode)).toBe(true);

    const parsed = parseTestCode(sampleCode);
    expect(parsed).not.toBeNull();
    expect(parsed.prefix).toBe(prefix);
  });
});

describe('폴백 시스템 테스트', () => {
  test('다양한 코드 형식을 올바르게 검증한다', () => {
    const fallbackCodes = [
      'MP259FB797',
      'MA258LF123ABC',
      'MG250AA001A',
      'EP251ZZ999',
    ];

    fallbackCodes.forEach((code) => {
      expect(validateCodeFormat(code)).toBe(true);
      expect(parseTestCode(code)).not.toBeNull();
    });
  });

  test('코드 파싱이 모든 구성 요소를 올바르게 추출한다', () => {
    const testCases = [
      {
        code: 'MP250AA001',
        expected: {
          prefix: 'MP',
          year: 25,
          sequence: 0,
          alphabet: 'AA',
          number: 1,
          extension: undefined,
        },
      },
      {
        code: 'MG259FB797',
        expected: {
          prefix: 'MG',
          year: 25,
          sequence: 9,
          alphabet: 'FB',
          number: 797,
          extension: undefined,
        },
      },
      {
        code: 'EA251BC123ABC',
        expected: {
          prefix: 'EA',
          year: 25,
          sequence: 1,
          alphabet: 'BC',
          number: 123,
          extension: 'ABC',
        },
      },
    ];

    testCases.forEach(({ code, expected }) => {
      expect(parseTestCode(code)).toEqual(expected);
    });
  });
});
