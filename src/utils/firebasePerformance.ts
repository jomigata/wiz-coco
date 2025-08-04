// Firebase Performance Monitoring 유틸리티 (더미 구현)
// 앱 성능 측정 및 모니터링 기능 제공

import { performance } from '@/lib/firebase';

// 더미 Performance Trace 인터페이스
interface DummyTrace {
  name: string;
  attributes: Record<string, string>;
}

/**
 * 성능 추적 시작 (더미 구현)
 * @param traceName - 추적 이름
 * @returns DummyTrace - 추적 객체
 */
export function startPerformanceTrace(traceName: string): DummyTrace | null {
  if (performance) {
    console.log(`[Performance] 추적 시작: ${traceName}`);
    return {
      name: traceName,
      attributes: {}
    };
  }
  return null;
}

/**
 * 성능 추적 종료 (더미 구현)
 * @param traceName - 추적 이름
 */
export function stopPerformanceTrace(traceName: string) {
  if (performance) {
    console.log(`[Performance] 추적 종료: ${traceName}`);
  }
}

/**
 * 페이지 로드 성능 측정 (더미 구현)
 * @param pageName - 페이지 이름
 */
export function measurePageLoad(pageName: string) {
  if (performance) {
    console.log(`[Performance] 페이지 로드 측정: ${pageName}`);
    // 페이지 로드 완료 시 로그
    window.addEventListener('load', () => {
      console.log(`[Performance] 페이지 로드 완료: ${pageName}`);
    });
  }
}

/**
 * API 호출 성능 측정 (더미 구현)
 * @param apiName - API 이름
 * @param apiCall - API 호출 함수
 * @returns Promise<any> - API 호출 결과
 */
export async function measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
  if (performance) {
    console.log(`[Performance] API 호출 시작: ${apiName}`);
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      console.log(`[Performance] API 호출 완료: ${apiName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[Performance] API 호출 실패: ${apiName} (${duration}ms)`, error);
      throw error;
    }
  } else {
    return apiCall();
  }
}

/**
 * 테스트 성능 측정 (더미 구현)
 * @param testType - 테스트 유형
 * @param testFunction - 테스트 실행 함수
 * @returns Promise<any> - 테스트 결과
 */
export async function measureTestPerformance<T>(testType: string, testFunction: () => Promise<T>): Promise<T> {
  if (performance) {
    console.log(`[Performance] 테스트 시작: ${testType}`);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      console.log(`[Performance] 테스트 완료: ${testType} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[Performance] 테스트 실패: ${testType} (${duration}ms)`, error);
      throw error;
    }
  } else {
    return testFunction();
  }
}

/**
 * 사용자 상호작용 성능 측정 (더미 구현)
 * @param interactionName - 상호작용 이름
 * @param interactionFunction - 상호작용 함수
 * @returns Promise<any> - 상호작용 결과
 */
export async function measureUserInteraction<T>(interactionName: string, interactionFunction: () => Promise<T>): Promise<T> {
  if (performance) {
    console.log(`[Performance] 사용자 상호작용 시작: ${interactionName}`);
    const startTime = Date.now();
    
    try {
      const result = await interactionFunction();
      const duration = Date.now() - startTime;
      console.log(`[Performance] 사용자 상호작용 완료: ${interactionName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[Performance] 사용자 상호작용 실패: ${interactionName} (${duration}ms)`, error);
      throw error;
    }
  } else {
    return interactionFunction();
  }
}

/**
 * 이미지 로드 성능 측정 (더미 구현)
 * @param imageUrl - 이미지 URL
 */
export function measureImageLoad(imageUrl: string): Promise<void> {
  return new Promise((resolve) => {
    if (performance) {
      console.log(`[Performance] 이미지 로드 시작: ${imageUrl}`);
      const startTime = Date.now();
      
      const img = new Image();
      img.onload = () => {
        const duration = Date.now() - startTime;
        console.log(`[Performance] 이미지 로드 완료: ${imageUrl} (${duration}ms)`);
        resolve();
      };
      img.onerror = () => {
        const duration = Date.now() - startTime;
        console.log(`[Performance] 이미지 로드 실패: ${imageUrl} (${duration}ms)`);
        resolve();
      };
      img.src = imageUrl;
    } else {
      resolve();
    }
  });
}

/**
 * 데이터베이스 쿼리 성능 측정 (더미 구현)
 * @param queryName - 쿼리 이름
 * @param queryFunction - 쿼리 함수
 * @returns Promise<any> - 쿼리 결과
 */
export async function measureDatabaseQuery<T>(queryName: string, queryFunction: () => Promise<T>): Promise<T> {
  if (performance) {
    console.log(`[Performance] DB 쿼리 시작: ${queryName}`);
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      console.log(`[Performance] DB 쿼리 완료: ${queryName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[Performance] DB 쿼리 실패: ${queryName} (${duration}ms)`, error);
      throw error;
    }
  } else {
    return queryFunction();
  }
} 