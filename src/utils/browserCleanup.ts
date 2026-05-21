// 브라우저 종료 시 개인정보 완전 삭제를 위한 유틸리티
import { clearAuthOnClose, initAuthSessionLifecycle } from '@/utils/authSessionLifecycle';

export const initBrowserCleanup = () => {
  if (typeof window === 'undefined') return;

  const cleanupAuthLifecycle = initAuthSessionLifecycle();

  // 브라우저 완전 종료 시 테스트/개인 데이터 삭제 (로그인 정보는 authSessionLifecycle에서 즉시 삭제)
  const clearNonAuthDataOnExit = () => {
    try {
      const nonAuthKeysToRemove = [
        'mbti_result',
        'mbti_answers',
        'mbti_completion_time',
        'mbti_test_code',
        'mbti_pro_completion_time',
        'mbti_pro_client_info',
      ];

      nonAuthKeysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (
          key.includes('user-test-records') ||
          key.includes('mbti-user-test-records') ||
          key.startsWith('client-info-') ||
          (key.includes('-test-') && !key.includes('auth') && !key.includes('login'))
        ) {
          localStorage.removeItem(key);
        }
      });

      console.log('[BrowserCleanup] 브라우저 종료 시 비인증 데이터 삭제 완료');
    } catch (error) {
      console.error('[BrowserCleanup] 브라우저 종료 정리 중 오류:', error);
    }
  };

  const handleBeforeUnload = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation?.type === 'reload') {
      console.log('[BrowserCleanup] 새로고침 감지 - 데이터 보존');
      sessionStorage.setItem('page_refreshing', 'true');
      return;
    }

    console.log('[BrowserCleanup] 브라우저 종료 감지 - 로그인 정보 즉시 삭제');
    clearAuthOnClose();
    clearNonAuthDataOnExit();
  };

  const handlePageHide = (event: PageTransitionEvent) => {
    if (event.persisted) return;
    if (sessionStorage.getItem('page_refreshing') || document.visibilityState === 'visible') {
      console.log('[BrowserCleanup] 페이지 이동 감지 - 데이터 보존');
      return;
    }

    console.log('[BrowserCleanup] 탭 닫기 감지 - 로그인 정보 즉시 삭제');
    clearAuthOnClose();
    clearNonAuthDataOnExit();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  const handleUnload = () => {
    clearAuthOnClose();
    clearNonAuthDataOnExit();
  };
  window.addEventListener('unload', handleUnload);
  window.addEventListener('pagehide', handlePageHide);

  return () => {
    cleanupAuthLifecycle();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('unload', handleUnload);
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