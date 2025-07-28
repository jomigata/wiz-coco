import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api`
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10002/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기 (클라이언트 사이드)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 오류 로깅
    console.error('API 응답 오류:', error?.response?.data || error.message);
    
    // 인증 오류 처리 (401)
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // 로그인 페이지로 리디렉션 (필요시)
        // window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API 엔드포인트 함수들
const api = {
  // 사용자 관련 API
  users: {
    register: (userData) => apiClient.post('/users', userData),
    login: (credentials) => apiClient.post('/auth/login', credentials),
    getProfile: () => apiClient.get('/users/profile'),
  },
  
  // 테스트 관련 API
  tests: {
    getTests: () => apiClient.get('/testdata'),
    saveResult: (resultData) => apiClient.post('/save-test-result', resultData),
    getUserTests: () => apiClient.get('/user-tests'),
    generateTestCode: (prefix) => apiClient.post('/generate-test-code', { prefix }),
  },
  
  // 기타 유틸리티 API
  utils: {
    getTimeInfo: () => apiClient.get('/time-info'),
  }
};

export default api; 