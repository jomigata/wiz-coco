/**
 * DB 기반 테스트 코드 생성 클라이언트
 * 안전한 동시성 코드 생성을 위한 클라이언트 인터페이스
 */

import { DBTestType } from './dbTestCodeGenerator';

export interface GenerateCodeRequest {
  testType: DBTestType;
  userId?: string;
}

export interface GenerateCodeResponse {
  success: boolean;
  code?: string;
  message: string;
  metadata?: {
    generatedAt: string;
    generationTime: number;
    testType: string;
    year: number;
    sequence: number;
    alphabet: string;
    number: number;
    extension?: string;
    clientInfo: {
      ip: string;
      timestamp: number;
    };
  };
  error?: string;
}

export interface ValidateCodeResponse {
  success: boolean;
  isValid: boolean;
  isUsed: boolean;
  testType?: string;
  generatedAt?: string;
  message: string;
  validation: {
    code: string;
    formatCheck: boolean;
    duplicateCheck: boolean;
    validationTime: number;
    timestamp: string;
  };
}

export interface CodeGenerationStats {
  success: boolean;
  statistics: {
    period: string;
    totalGenerated: number;
    duplicatesDetected: number;
    concurrentRequests: number;
    performance: {
      avgGenerationTime: number;
      currentLoad: number;
      successRate: number;
      duplicateRate: number;
    };
    status: {
      overall: 'healthy' | 'warning' | 'critical';
      performance: 'good' | 'slow';
      duplicateRate: 'good' | 'warning' | 'critical';
      load: 'low' | 'medium' | 'high';
    };
  };
  metadata: {
    queryTime: number;
    timestamp: string;
    period: string;
    format: string;
  };
}

/**
 * DB 기반 테스트 코드 생성 클라이언트
 */
export class DBTestCodeClient {
  private baseUrl: string;
  private timeout: number;
  
  constructor(baseUrl: string = '/api/test-codes', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }
  
  /**
   * 새로운 테스트 코드 생성
   */
  async generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`[클라이언트] 코드 생성 요청: ${request.testType}`);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const result = await response.json();
      const requestTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`[클라이언트] 코드 생성 성공: ${result.code} (${requestTime}ms)`);
        
        // 로컬 스토리지에 생성된 코드 기록 (백업용)
        this.recordGeneratedCode(result.code, request.testType);
      } else {
        console.warn(`[클라이언트] 코드 생성 실패: ${result.message}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('[클라이언트] 코드 생성 요청 중 오류:', error);
      
      return {
        success: false,
        message: '코드 생성 요청 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'NETWORK_ERROR'
      };
    }
  }
  
  /**
   * 테스트 코드 검증
   */
  async validateCode(code: string): Promise<ValidateCodeResponse> {
    try {
      console.log(`[클라이언트] 코드 검증 요청: ${code}`);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/${encodeURIComponent(code)}/validate`);
      const result = await response.json();
      
      console.log(`[클라이언트] 코드 검증 완료: ${code} - 유효: ${result.isValid}, 사용됨: ${result.isUsed}`);
      
      return result;
      
    } catch (error) {
      console.error('[클라이언트] 코드 검증 중 오류:', error);
      
      return {
        success: false,
        isValid: false,
        isUsed: false,
        message: '코드 검증 중 오류가 발생했습니다.',
        validation: {
          code,
          formatCheck: false,
          duplicateCheck: false,
          validationTime: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * 배치 코드 검증
   */
  async validateCodes(codes: string[]): Promise<{
    success: boolean;
    results: Array<{
      code: string;
      isValid: boolean;
      isUsed: boolean;
      testType?: string;
      generatedAt?: string;
      error?: string;
    }>;
    statistics: {
      total: number;
      valid: number;
      used: number;
      errors: number;
    };
  }> {
    try {
      console.log(`[클라이언트] 배치 코드 검증 요청: ${codes.length}개`);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/batch/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes }),
      });
      
      const result = await response.json();
      
      console.log(`[클라이언트] 배치 검증 완료: ${result.statistics.total}개 중 ${result.statistics.valid}개 유효`);
      
      return result;
      
    } catch (error) {
      console.error('[클라이언트] 배치 검증 중 오류:', error);
      
      return {
        success: false,
        results: [],
        statistics: { total: 0, valid: 0, used: 0, errors: 0 }
      };
    }
  }
  
  /**
   * 코드 생성 통계 조회
   */
  async getStats(period: string = '1h', format: string = 'json'): Promise<CodeGenerationStats> {
    try {
      console.log(`[클라이언트] 통계 조회: ${period}`);
      
      const url = `${this.baseUrl}/stats?period=${period}&format=${format}`;
      const response = await this.fetchWithTimeout(url);
      const result = await response.json();
      
      console.log(`[클라이언트] 통계 조회 완료: 생성 ${result.statistics.totalGenerated}개, 중복률 ${result.statistics.performance.duplicateRate}%`);
      
      return result;
      
    } catch (error) {
      console.error('[클라이언트] 통계 조회 중 오류:', error);
      
      return {
        success: false,
        statistics: {
          period,
          totalGenerated: 0,
          duplicatesDetected: 0,
          concurrentRequests: 0,
          performance: {
            avgGenerationTime: 0,
            currentLoad: 0,
            successRate: 0,
            duplicateRate: 0
          },
          status: {
            overall: 'critical',
            performance: 'slow',
            duplicateRate: 'critical',
            load: 'high'
          }
        },
        metadata: {
          queryTime: 0,
          timestamp: new Date().toISOString(),
          period,
          format
        }
      };
    }
  }
  
  /**
   * 실시간 통계 모니터링 (EventSource)
   */
  createStatsStream(callback: (data: any) => void): EventSource | null {
    try {
      console.log('[클라이언트] 실시간 통계 스트림 시작');
      
      const eventSource = new EventSource(`${this.baseUrl}/stats`, {
        withCredentials: false
      });
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('[클라이언트] SSE 데이터 파싱 오류:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('[클라이언트] SSE 연결 오류:', error);
      };
      
      return eventSource;
      
    } catch (error) {
      console.error('[클라이언트] SSE 스트림 생성 오류:', error);
      return null;
    }
  }
  
  /**
   * 타임아웃이 적용된 fetch
   */
  private async fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * 생성된 코드를 로컬 스토리지에 기록 (백업용)
   */
  private recordGeneratedCode(code: string, testType: string): void {
    try {
      if (typeof window === 'undefined' || !localStorage) return;
      
      const record = {
        code,
        testType,
        generatedAt: new Date().toISOString(),
        source: 'db_api'
      };
      
      // 기존 기록 조회
      const existingRecords = JSON.parse(localStorage.getItem('db_generated_codes') || '[]');
      
      // 새 기록 추가 (최대 1000개 유지)
      existingRecords.push(record);
      if (existingRecords.length > 1000) {
        existingRecords.splice(0, existingRecords.length - 1000);
      }
      
      localStorage.setItem('db_generated_codes', JSON.stringify(existingRecords));
      
    } catch (error) {
      console.warn('[클라이언트] 로컬 기록 저장 중 오류:', error);
    }
  }
  
  /**
   * 로컬에 기록된 코드 조회
   */
  getLocalRecords(): Array<{ code: string; testType: string; generatedAt: string; source: string }> {
    try {
      if (typeof window === 'undefined' || !localStorage) return [];
      
      return JSON.parse(localStorage.getItem('db_generated_codes') || '[]');
      
    } catch (error) {
      console.warn('[클라이언트] 로컬 기록 조회 중 오류:', error);
      return [];
    }
  }
  
  /**
   * 로컬 기록 정리
   */
  clearLocalRecords(): void {
    try {
      if (typeof window === 'undefined' || !localStorage) return;
      
      localStorage.removeItem('db_generated_codes');
      console.log('[클라이언트] 로컬 기록 정리 완료');
      
    } catch (error) {
      console.warn('[클라이언트] 로컬 기록 정리 중 오류:', error);
    }
  }
}

// 기본 클라이언트 인스턴스
export const dbCodeClient = new DBTestCodeClient();

// 편의 함수들
export const generateTestCode = (testType: DBTestType, userId?: string) => 
  dbCodeClient.generateCode({ testType, userId });

export const validateTestCode = (code: string) => 
  dbCodeClient.validateCode(code);

export const getCodeStats = (period?: string) => 
  dbCodeClient.getStats(period);

export default DBTestCodeClient; 