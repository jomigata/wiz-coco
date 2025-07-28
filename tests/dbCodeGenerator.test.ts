/**
 * DB 기반 테스트 코드 생성기 동시성 테스트
 * 수백명이 동시에 검사를 완료하는 상황을 시뮬레이션
 */

import { 
  generateTestCodeWithLock, 
  validateTestCode,
  getCodeGenerationStats,
  cleanup,
  DBTestType,
  CodeGenerationRequest 
} from '../src/utils/dbTestCodeGenerator';

describe('DB 기반 코드 생성기 동시성 테스트', () => {
  
  beforeAll(async () => {
    console.log('=== 동시성 테스트 시작 ===');
  });
  
  afterAll(async () => {
    await cleanup();
    console.log('=== 동시성 테스트 완료 ===');
  });
  
  // 클라이언트 정보 생성 헬퍼
  const createClientInfo = (index: number) => ({
    ip: `192.168.1.${100 + (index % 155)}`,
    userAgent: `TestClient/${index} (Test Suite)`,
    timestamp: Date.now() + index
  });
  
  // 코드 생성 요청 생성 헬퍼
  const createCodeRequest = (testType: DBTestType, index: number): CodeGenerationRequest => ({
    testType,
    userId: `test-user-${index}`,
    clientInfo: createClientInfo(index)
  });
  
  describe('소규모 동시성 테스트 (10명)', () => {
    it('10명이 동시에 AMATEUR 코드 생성 시 중복 없이 처리', async () => {
      const concurrentUsers = 10;
      const promises: Promise<any>[] = [];
      
      console.log(`[테스트] ${concurrentUsers}명 동시 코드 생성 시작`);
      
      for (let i = 0; i < concurrentUsers; i++) {
        const request = createCodeRequest('AMATEUR', i);
        promises.push(generateTestCodeWithLock(request));
      }
      
      const results = await Promise.all(promises);
      
      // 모든 요청이 성공했는지 확인
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      console.log(`[테스트] 성공: ${successfulResults.length}, 실패: ${failedResults.length}`);
      
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // 생성된 코드들 추출
      const codes = successfulResults.map(r => r.code).filter(Boolean);
      const uniqueCodes = new Set(codes);
      
      // 중복 없이 생성되었는지 확인
      expect(uniqueCodes.size).toBe(codes.length);
      
      // 모든 코드가 올바른 형식인지 확인
      for (const code of codes) {
        expect(code).toMatch(/^MA\d{2}\d-[A-Z]{2}\d{3}[A-Z]*$/);
      }
      
      console.log(`[테스트] 생성된 코드: ${codes.join(', ')}`);
    }, 30000); // 30초 타임아웃
  });
  
  describe('중간 규모 동시성 테스트 (50명)', () => {
    it('50명이 동시에 다양한 타입의 코드 생성', async () => {
      const concurrentUsers = 50;
      const testTypes: DBTestType[] = ['AMATEUR', 'PROFESSIONAL', 'GROUP'];
      const promises: Promise<any>[] = [];
      
      console.log(`[테스트] ${concurrentUsers}명 동시 다양한 타입 코드 생성 시작`);
      
      for (let i = 0; i < concurrentUsers; i++) {
        const testType = testTypes[i % testTypes.length];
        const request = createCodeRequest(testType, i);
        promises.push(generateTestCodeWithLock(request));
      }
      
      const results = await Promise.all(promises);
      
      // 결과 분석
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      console.log(`[테스트] 전체: ${results.length}, 성공: ${successfulResults.length}, 실패: ${failedResults.length}`);
      
      // 최소 80% 이상 성공해야 함
      expect(successfulResults.length).toBeGreaterThanOrEqual(concurrentUsers * 0.8);
      
      // 타입별 결과 확인
      const codesByType: { [key: string]: string[] } = {};
      successfulResults.forEach(result => {
        if (result.code) {
          const prefix = result.code.substring(0, 2);
          if (!codesByType[prefix]) codesByType[prefix] = [];
          codesByType[prefix].push(result.code);
        }
      });
      
      // 각 타입별로 중복 없는지 확인
      for (const [prefix, codes] of Object.entries(codesByType)) {
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBe(codes.length);
        console.log(`[테스트] ${prefix} 타입: ${codes.length}개 코드 생성`);
      }
    }, 60000); // 60초 타임아웃
  });
  
  describe('대규모 동시성 테스트 (100명)', () => {
    it('100명이 동시에 코드 생성 시 3초 이내 완료', async () => {
      const concurrentUsers = 100;
      const startTime = Date.now();
      
      console.log(`[테스트] ${concurrentUsers}명 대규모 동시 코드 생성 시작`);
      
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < concurrentUsers; i++) {
        const request = createCodeRequest('AMATEUR', i);
        promises.push(generateTestCodeWithLock(request));
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[테스트] ${concurrentUsers}명 처리 완료, 소요시간: ${duration}ms`);
      
      // 성능 검증
      expect(duration).toBeLessThan(3000); // 3초 이내
      
      // 결과 분석
      const successfulResults = results.filter(r => r.success);
      const lockFailures = results.filter(r => r.error === 'LOCK_ACQUISITION_FAILED');
      
      console.log(`[테스트] 성공: ${successfulResults.length}, 락 실패: ${lockFailures.length}`);
      
      // 최소 50% 이상은 성공해야 함 (높은 동시성에서는 락 경합 발생 가능)
      expect(successfulResults.length).toBeGreaterThanOrEqual(concurrentUsers * 0.5);
      
      // 생성된 코드 중복 검증
      const codes = successfulResults.map(r => r.code).filter(Boolean);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    }, 120000); // 120초 타임아웃
  });
  
  describe('코드 검증 테스트', () => {
    it('생성된 코드들이 올바르게 검증됨', async () => {
      console.log('[테스트] 코드 검증 테스트 시작');
      
      // 먼저 몇 개의 코드 생성
      const testCodes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const request = createCodeRequest('AMATEUR', i);
        const result = await generateTestCodeWithLock(request);
        if (result.success && result.code) {
          testCodes.push(result.code);
        }
      }
      
      console.log(`[테스트] 검증할 코드: ${testCodes.join(', ')}`);
      
      // 생성된 코드들 검증
      for (const code of testCodes) {
        const validation = await validateTestCode(code);
        
        expect(validation.isValid).toBe(true);
        // 아직 사용되지 않았으므로 isUsed는 false여야 함
        expect(validation.isUsed).toBe(false);
      }
      
      // 잘못된 형식의 코드 검증
      const invalidCodes = ['INVALID', '123', 'MA25-AA', 'MP250-AAAA'];
      
      for (const code of invalidCodes) {
        const validation = await validateTestCode(code);
        expect(validation.isValid).toBe(false);
      }
    });
  });
  
  describe('통계 조회 테스트', () => {
    it('코드 생성 통계가 올바르게 조회됨', async () => {
      console.log('[테스트] 통계 조회 테스트 시작');
      
      // 통계 조회
      const stats = await getCodeGenerationStats();
      
      console.log(`[테스트] 통계: 총 ${stats.totalGenerated}개, 중복 ${stats.duplicatesDetected}개`);
      
      // 기본 검증
      expect(stats.totalGenerated).toBeGreaterThanOrEqual(0);
      expect(stats.duplicatesDetected).toBeGreaterThanOrEqual(0);
      expect(stats.duplicatesDetected).toBeLessThanOrEqual(stats.totalGenerated);
      expect(stats.averageGenerationTime).toBeGreaterThanOrEqual(0);
      expect(stats.concurrentRequests).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeLessThanOrEqual(1);
    });
  });
  
  describe('스트레스 테스트', () => {
    it('연속적인 코드 생성 요청 처리', async () => {
      const batchSize = 20;
      const batches = 5;
      
      console.log(`[테스트] 스트레스 테스트: ${batches}배치 x ${batchSize}개 = ${batches * batchSize}개 코드`);
      
      const allCodes: string[] = [];
      
      for (let batch = 0; batch < batches; batch++) {
        console.log(`[테스트] 배치 ${batch + 1}/${batches} 시작`);
        
        const promises: Promise<any>[] = [];
        for (let i = 0; i < batchSize; i++) {
          const request = createCodeRequest('AMATEUR', batch * batchSize + i);
          promises.push(generateTestCodeWithLock(request));
        }
        
        const results = await Promise.all(promises);
        const batchCodes = results
          .filter(r => r.success)
          .map(r => r.code)
          .filter(Boolean);
        
        allCodes.push(...batchCodes);
        
        console.log(`[테스트] 배치 ${batch + 1} 완료: ${batchCodes.length}개 코드 생성`);
        
        // 배치 간 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 전체 결과 검증
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBe(allCodes.length);
      
      console.log(`[테스트] 스트레스 테스트 완료: 총 ${allCodes.length}개 고유 코드 생성`);
    }, 180000); // 180초 타임아웃
  });
  
  describe('에러 처리 테스트', () => {
    it('잘못된 테스트 타입으로 요청 시 적절한 에러 처리', async () => {
      const invalidRequest = {
        testType: 'INVALID_TYPE' as DBTestType,
        clientInfo: createClientInfo(0)
      };
      
      try {
        await generateTestCodeWithLock(invalidRequest);
        // 에러가 발생해야 하므로 여기에 도달하면 테스트 실패
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

// 성능 벤치마크 테스트
describe('성능 벤치마크', () => {
  it('단일 코드 생성 성능 측정', async () => {
    const iterations = 10;
    const times: number[] = [];
    
    console.log(`[벤치마크] ${iterations}회 단일 코드 생성 성능 측정`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const request = createCodeRequest('AMATEUR', i);
      const result = await generateTestCodeWithLock(request);
      const endTime = Date.now();
      
      if (result.success) {
        times.push(endTime - startTime);
      }
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`[벤치마크] 평균: ${avgTime.toFixed(2)}ms, 최소: ${minTime}ms, 최대: ${maxTime}ms`);
    
    // 성능 기준: 평균 500ms 이내
    expect(avgTime).toBeLessThan(500);
  });
});

// 헬퍼 함수
const createCodeRequest = (testType: DBTestType, index: number): CodeGenerationRequest => ({
  testType,
  userId: `test-user-${index}`,
  clientInfo: {
    ip: `192.168.1.${100 + (index % 155)}`,
    userAgent: `TestClient/${index} (Test Suite)`,
    timestamp: Date.now() + index
  }
}); 