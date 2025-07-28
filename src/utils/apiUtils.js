// API 요청 핸들링을 위한 유틸리티 함수 모음
import axios from 'axios';

// API 요청 상태 관리를 위한 상수
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 15000; // 15초

// API 클라이언트 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 - 에러 처리 및 응답 형식화
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답 처리
    return response.data;
  },
  (error) => {
    // 오류 응답 처리
    let errorMessage = '서버 요청 중 오류가 발생했습니다.';
    let statusCode = 500;
    
    if (error.response) {
      // 서버가 응답을 반환한 경우
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || `오류 코드: ${statusCode}`;
      
      // 401 인증 오류 처리
      if (statusCode === 401) {
        // 인증 만료시 로컬 저장소 초기화
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
      }
      
      // 404 리소스 없음 오류
      if (statusCode === 404) {
        errorMessage = '요청한 리소스를 찾을 수 없습니다.';
      }
      
      // 403 권한 오류
      if (statusCode === 403) {
        errorMessage = '해당 작업에 대한 권한이 없습니다.';
      }
    } else if (error.request) {
      // 요청이 전송되었으나 응답이 없는 경우
      errorMessage = '서버 응답이 없습니다. 네트워크 연결을 확인해주세요.';
      statusCode = 0; // 네트워크 오류
    }
    
    // 오류 객체 구성
    const errorObject = {
      message: errorMessage,
      statusCode,
      originalError: error,
      isOffline: !navigator.onLine,
    };
    
    // 콘솔에 오류 로깅
    console.error('API 오류:', errorObject);
    
    // 오류 객체 반환 (Promise.reject를 통해)
    return Promise.reject(errorObject);
  }
);

// 요청 인터셉터 - 토큰 첨부 및 요청 전처리
apiClient.interceptors.request.use(
  (config) => {
    // 브라우저 환경에서만 localStorage 접근
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // 오프라인 상태 확인
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // 오프라인 상태일 때 IndexedDB나 로컬 스토리지에서 데이터 조회 로직 가능
      // 여기서는 오프라인 오류만 발생시킴
      return Promise.reject({
        message: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
        statusCode: 0,
        isOffline: true,
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API 래퍼 함수 - 재시도 로직 포함
export async function fetchWithRetry(apiCall, retryCount = 3, retryDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`요청 실패 (${attempt + 1}/${retryCount}). 재시도 중...`);
      lastError = error;
      
      // 특정 오류는 재시도하지 않음 (인증 오류, 권한 오류 등)
      if (error.statusCode === 401 || error.statusCode === 403) {
        break;
      }
      
      // 지수 백오프를 사용한 지연
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // 모든 재시도 실패 후 마지막 오류 반환
  throw lastError;
}

// API 요청 함수들
export const api = {
  // GET 요청
  async get(url, config = {}) {
    try {
      return await apiClient.get(url, config);
    } catch (error) {
      throw error;
    }
  },
  
  // POST 요청
  async post(url, data = {}, config = {}) {
    try {
      return await apiClient.post(url, data, config);
    } catch (error) {
      throw error;
    }
  },
  
  // PUT 요청
  async put(url, data = {}, config = {}) {
    try {
      return await apiClient.put(url, data, config);
    } catch (error) {
      throw error;
    }
  },
  
  // DELETE 요청
  async delete(url, config = {}) {
    try {
      return await apiClient.delete(url, config);
    } catch (error) {
      throw error;
    }
  }
}; 