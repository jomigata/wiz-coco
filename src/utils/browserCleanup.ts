// 브라우저 종료 시 개인정보 완전 삭제를 위한 유틸리티

// 세션 식별자를 위한 키
const SESSION_ID_KEY = 'current_session_id';
const LAST_ACTIVITY_KEY = 'last_activity_time';

// 현재 세션 ID 생성
const generateSessionId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 현재 세션인지 확인
const isCurrentSession = () => {
  const currentSessionId = sessionStorage.getItem(SESSION_ID_KEY);
  const storedSessionId = localStorage.getItem(SESSION_ID_KEY);
  return currentSessionId && currentSessionId === storedSessionId;
};

export const initBrowserCleanup = () => {
  if (typeof window === 'undefined') return;

  // 브라우저 완전 종료 시 모든 데이터 삭제
  const clearAllDataOnExit = () => {
    try {
      // 모든 개인정보 및 로그인 정보 삭제
      const allKeysToRemove = [
        'isLoggedIn',
        'userToken', 
        'user',
        'mbti_result',
        'mbti_answers',
        'mbti_completion_time',
        'mbti_test_code',
        'mbti_pro_completion_time',
        'mbti_pro_client_info',
        'auth_status',
        'session_token',
        'login_time'
      ];

      allKeysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // 패턴 매치로 모든 관련 데이터 삭제
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('user-test-records') || 
            key.includes('mbti-user-test-records') ||
            key.startsWith('client-info-') ||
            key.includes('-test-') ||
            key.includes('auth') ||
            key.includes('session') ||
            key.includes('login')) {
          localStorage.removeItem(key);
        }
      });

      // sessionStorage 전체 삭제
      sessionStorage.clear();

      console.log('[BrowserCleanup] 브라우저 종료 시 모든 데이터 삭제 완료');
    } catch (error) {
      console.error('[BrowserCleanup] 브라우저 종료 정리 중 오류:', error);
    }
  };

  // 브라우저 종료/새로고침 구분
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // 새로고침인지 확인
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation?.type === 'reload') {
      console.log('[BrowserCleanup] 새로고침 감지 - 데이터 보존');
      sessionStorage.setItem('page_refreshing', 'true');
      return;
    }
    
    // 진짜 브라우저 종료인 경우에만 데이터 삭제
    console.log('[BrowserCleanup] 브라우저 종료 감지 - 데이터 삭제');
    clearAllDataOnExit();
  };

  // 페이지 언로드 시 (탭 닫기 등) - 매우 보수적으로 실행
  const handlePageHide = () => {
    // 새로고침 중이거나 페이지 이동 중이면 실행하지 않음
    if (sessionStorage.getItem('page_refreshing') || 
        document.visibilityState === 'visible') {
      console.log('[BrowserCleanup] 페이지 이동 감지 - 데이터 보존');
      return;
    }
    
    console.log('[BrowserCleanup] 탭 닫기 감지 - 데이터 삭제');
    clearAllDataOnExit();
  };

  // 이벤트 리스너 등록 (visibilitychange 제거)
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('unload', clearAllDataOnExit);
  window.addEventListener('pagehide', handlePageHide);

  // 페이지 로드 시 새로고침 플래그 제거
  setTimeout(() => {
    sessionStorage.removeItem('page_refreshing');
  }, 500);

  // cleanup 함수 반환
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('unload', clearAllDataOnExit);
    window.removeEventListener('pagehide', handlePageHide);
  };
};

// 수동 로그아웃 함수 (로그아웃 버튼 클릭 시 사용)
export const manualLogout = () => {
  if (typeof window === 'undefined') return;

  try {
    // 로그인 관련 정보만 삭제
    const loginKeys = [
      'isLoggedIn',
      'userToken', 
      'user',
      'auth_status',
      'session_token',
      'login_time'
    ];

    loginKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    sessionStorage.clear();

    console.log('[BrowserCleanup] 수동 로그아웃 완료');
    return true;
  } catch (error) {
    console.error('[BrowserCleanup] 수동 로그아웃 중 오류:', error);
    return false;
  }
};

// 테스트 데이터만 정리하는 함수
export const clearTestDataOnly = () => {
  if (typeof window === 'undefined') return;

  try {
    const testKeys = [
      'mbti_result',
      'mbti_answers',
      'mbti_completion_time',
      'mbti_test_code',
      'mbti_pro_completion_time',
      'mbti_pro_client_info'
    ];

    testKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('[BrowserCleanup] 테스트 데이터만 정리 완료');
    return true;
  } catch (error) {
    console.error('[BrowserCleanup] 테스트 데이터 정리 중 오류:', error);
    return false;
  }
}; 