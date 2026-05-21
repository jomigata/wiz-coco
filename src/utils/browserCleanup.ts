// 브라우저 종료 시 개인정보 완전 삭제를 위한 유틸리티
import { initAuthSessionLifecycle } from '@/utils/authSessionLifecycle';

export const initBrowserCleanup = () => {
  if (typeof window === 'undefined') return;

  const cleanupAuthLifecycle = initAuthSessionLifecycle();

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
      sessionStorage.setItem('page_refreshing', 'true');
      return;
    }
    clearNonAuthDataOnExit();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    cleanupAuthLifecycle();
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};
