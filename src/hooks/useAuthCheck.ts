import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthState, setAuthState } from '@/utils/localStorageManager';

interface UseAuthCheckReturn {
  isLoggedIn: boolean;
  isLoading: boolean;
}

export const useAuthCheck = (): UseAuthCheckReturn => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  // 로그인 상태 확인 함수 - Navigation 컴포넌트와 동일한 방식 사용
  const checkLoginStatus = async () => {
    try {
      // SSR 환경에서는 항상 false 반환
      if (typeof window === 'undefined' || !isMountedRef.current) {
        return false;
      }
      
      // 먼저 로컬 임시 인증 상태 확인 (빠른 응답)
      const authState = getAuthState();
      if (authState && authState.isLoggedIn && authState.userBasicInfo) {
        console.log('[useAuthCheck] ✅ 로컬 임시 인증 상태 확인됨:', authState.userBasicInfo.email);
        return true;
      }
      
      // 로컬 임시 인증 상태가 없는 경우에만 서버 API 호출
      console.log('[useAuthCheck] 로컬 임시 인증 상태 없음 - 서버 API 확인');
      try {
        // fetch API 호출 전 브라우저 환경 재확인
        if (typeof window === 'undefined' || typeof fetch === 'undefined') {
          console.warn('[useAuthCheck] 브라우저 환경이 아니거나 fetch API를 사용할 수 없습니다.');
          return false;
        }

        const response = await fetch('/api/simple-login', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[useAuthCheck] 서버 API 인증 상태 응답:', data);
          
          if (data.isLoggedIn && data.user) {
            console.log('[useAuthCheck] ✅ 서버 API에서 로그인 상태 확인됨:', data.user);
            
            // 임시 인증 상태 저장
            setAuthState(true, data.user);
            return true;
          }
        }
      } catch (apiError) {
        console.warn("[useAuthCheck] 서버 API 호출 오류:", apiError);
        // API 오류 시에도 계속 진행 (폴백 처리)
      }
      
      // 모든 인증 확인 실패 시 로그아웃 상태
      console.log('[useAuthCheck] ❌ 인증 정보 없음');
      return false;
    } catch (error) {
      console.error('[useAuthCheck] ❌ 로그인 상태 확인 오류:', error);
      return false;
    }
  };

  // 로그인 상태 업데이트
  const updateAuthState = (isLoggedIn: boolean) => {
    if (!isMountedRef.current) return;
    
    console.log('[useAuthCheck] 🔄 인증 상태 업데이트:', isLoggedIn);
    setIsLoggedIn(isLoggedIn);
    setIsLoading(false);
  };

  // 초기 로그인 상태 확인 - 즉시 실행으로 최적화
  useEffect(() => {
    isMountedRef.current = true;
    
    // 비동기 함수로 즉시 실행하여 로딩 시간 최소화
    const initializeAuth = async () => {
      const loginStatus = await checkLoginStatus();
      updateAuthState(loginStatus);
    };
    
    initializeAuth();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // localStorage 변화 감지 (다른 탭에서의 로그인/로그아웃)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // getAuthState에서 사용하는 키만 감지
      if (e.key === 'oktest-auth-state') {
        console.log('[useAuthCheck] 📡 인증 상태 Storage 변화 감지:', { 
          key: e.key,
          newValue: e.newValue,
          oldValue: e.oldValue
        });
        
        // 즉시 상태 재확인
        if (isMountedRef.current) {
          checkLoginStatus().then(loginStatus => {
            updateAuthState(loginStatus);
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 로그인 상태 변경 이벤트 감지 (Navigation 컴포넌트와 동기화)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLoginStatusChange = (event: Event | CustomEvent) => {
      console.log('[useAuthCheck] 📡 로그인 상태 변경 이벤트 감지');
      
      if (event instanceof CustomEvent && event.detail) {
        const { isLoggedIn: eventIsLoggedIn } = event.detail;
        
        if (isMountedRef.current) {
          console.log('[useAuthCheck] 🔄 이벤트로부터 상태 업데이트:', eventIsLoggedIn);
          updateAuthState(eventIsLoggedIn);
        }
      }
    };

    window.addEventListener('login-status-changed', handleLoginStatusChange);
    
    return () => {
      window.removeEventListener('login-status-changed', handleLoginStatusChange);
    };
  }, []);

  // 페이지 포커스 시 상태 재확인 - 빈도를 줄여 성능 최적화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let focusTimeout: NodeJS.Timeout;
    const handleFocus = () => {
      // 디바운스 처리로 빈번한 재확인 방지
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(async () => {
        console.log('[useAuthCheck] 🔍 페이지 포커스 - 상태 재확인');
        if (isMountedRef.current) {
          const loginStatus = await checkLoginStatus();
          updateAuthState(loginStatus);
        }
      }, 500); // 500ms 디바운스
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(focusTimeout);
    };
  }, []);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    isLoggedIn,
    isLoading
  };
}; 