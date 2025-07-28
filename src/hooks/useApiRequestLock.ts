import { useCallback, useState, useEffect } from 'react';

/**
 * API 요청 락을 관리하는 Hook
 * @returns [isLocked, setLock, clearLock] 락 상태(boolean), 락 설정 함수, 락 해제 함수
 */
export default function useApiRequestLock(): [boolean, (requestId: string) => void, (requestId: string) => void] {
  // 락 상태를 React 상태로 관리
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // 코드 생성 키 (요청 중복 방지용 식별자)
  const codeGenerationKey = typeof window !== 'undefined' ? 
    (window.location.pathname + window.location.search).replace(/[^a-zA-Z0-9]/g, '-') : 
    'default-key';

  // 초기 락 상태 확인 (컴포넌트 마운트 시)
  useEffect(() => {
    const checkInitialLock = () => {
      if (typeof window === 'undefined') return false;
      
      // 세션 스토리지에서 락 확인 (현재 브라우저 세션)
      const sessionLock = sessionStorage.getItem(`mbti-code-request-lock-${codeGenerationKey}`);
      if (sessionLock) {
        const lockData = JSON.parse(sessionLock);
        // 락이 30초 이내에 설정된 경우 유효
        if (Date.now() - lockData.timestamp < 30000) {
          return true;
        }
      }
      
      // 로컬 스토리지에서 락 확인 (브라우저 전체)
      const localLock = localStorage.getItem(`mbti-code-request-lock-${codeGenerationKey}`);
      if (localLock) {
        const lockData = JSON.parse(localLock);
        // 락이 30초 이내에 설정된 경우 유효
        if (Date.now() - lockData.timestamp < 30000) {
          return true;
        }
      }
      
      return false;
    };

    setIsLocked(checkInitialLock());

    // 10초마다 락 상태 확인
    const intervalId = setInterval(() => {
      setIsLocked(checkInitialLock());
    }, 10000);

    return () => clearInterval(intervalId);
  }, [codeGenerationKey]);

  // 요청 락 설정 함수
  const setLock = useCallback((requestId: string) => {
    if (typeof window === 'undefined') return;
    
    const lockData = {
      requestId,
      timestamp: Date.now()
    };
    
    // 세션 스토리지에 락 설정 (현재 브라우저 세션)
    sessionStorage.setItem(`mbti-code-request-lock-${codeGenerationKey}`, JSON.stringify(lockData));
    
    // 로컬 스토리지에도 락 설정 (브라우저 전체)
    localStorage.setItem(`mbti-code-request-lock-${codeGenerationKey}`, JSON.stringify(lockData));
    
    // 상태 업데이트
    setIsLocked(true);
    
    console.log(`[${new Date().toISOString()}] 요청 락 설정: ${requestId}`);
  }, [codeGenerationKey]);

  // 요청 락 해제 함수
  const clearLock = useCallback((requestId: string) => {
    if (typeof window === 'undefined') return;
    
    // 세션 스토리지에서 락 확인
    const sessionLock = sessionStorage.getItem(`mbti-code-request-lock-${codeGenerationKey}`);
    if (sessionLock) {
      const lockData = JSON.parse(sessionLock);
      // 요청 ID가 일치하는 경우만 락 해제
      if (lockData.requestId === requestId) {
        sessionStorage.removeItem(`mbti-code-request-lock-${codeGenerationKey}`);
      }
    }
    
    // 로컬 스토리지에서도 락 확인
    const localLock = localStorage.getItem(`mbti-code-request-lock-${codeGenerationKey}`);
    if (localLock) {
      const lockData = JSON.parse(localLock);
      // 요청 ID가 일치하는 경우만 락 해제
      if (lockData.requestId === requestId) {
        localStorage.removeItem(`mbti-code-request-lock-${codeGenerationKey}`);
      }
    }
    
    // 상태 업데이트
    setIsLocked(false);
    
    console.log(`[${new Date().toISOString()}] 요청 락 해제: ${requestId}`);
  }, [codeGenerationKey]);

  return [isLocked, setLock, clearLock];
} 