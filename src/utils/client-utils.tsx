'use client';

import React, { useEffect, useState, ReactNode } from 'react';

// 클라이언트 사이드에서만 렌더링하기 위한 유틸리티 래퍼
interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps): ReactNode {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 서버 사이드 렌더링 시에는 fallback 반환
  if (!isClient) {
    return fallback;
  }

  // 클라이언트 사이드에서만 children 렌더링
  return children;
}

// 하이드레이션 불일치를 방지하기 위한 유틸리티
export function suppressHydrationWarning(element: any): any {
  if (typeof element === 'object' && element !== null && 'props' in element) {
    return {
      ...element,
      props: {
        ...element.props,
        suppressHydrationWarning: true
      }
    };
  }
  return element;
}

// DOM 조작을 안전하게 수행하기 위한 유틸리티
export function safeDOMOperation<T>(operation: () => T, defaultValue: T): T {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return defaultValue;
  }
  
  try {
    return operation();
  } catch (error) {
    console.error('DOM 조작 중 오류 발생:', error);
    return defaultValue;
  }
}

// 특정 DOM 요소를 안전하게 가져오는 유틸리티
export function safeGetElement(selector: string): HTMLElement | null {
  return safeDOMOperation(() => document.querySelector(selector), null);
}

// 브라우저 창 크기 관련 훅 (서버/클라이언트 불일치 방지)
interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export function useWindowSize(): WindowSize {
  // 초기 상태는 undefined로 설정 (서버/클라이언트 불일치 방지)
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // 클라이언트 사이드에서만 실행되는 핸들러
    function handleResize(): void {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // 이벤트 리스너 등록
    window.addEventListener("resize", handleResize);
    
    // 초기화 호출
    handleResize();
    
    // 클린업 함수
    return () => window.removeEventListener("resize", handleResize);
  }, []); // 빈 의존성 배열 - 마운트/언마운트 시에만 실행

  return windowSize;
}

// 브라우저 여부 확인
export const isBrowser: boolean = typeof window !== 'undefined';

// 안전한 localStorage 접근
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 상태 초기화 로직
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isBrowser) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 상태 업데이트 함수
  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      // 함수로 전달된 경우 처리
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // localStorage는 클라이언트 사이드에서만 접근
      if (isBrowser) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Next.js 라우터 관련 이슈 해결을 위한 유틸리티
interface SafeRouterResult {
  isRouterReady: boolean;
}

export function useSafeRouter(): SafeRouterResult {
  const [isRouterReady, setIsRouterReady] = useState(false);
  
  useEffect(() => {
    setIsRouterReady(true);
  }, []);
  
  return { isRouterReady };
}

// 서버/클라이언트 환경 판별
export const isServer: boolean = typeof window === 'undefined';
export const isClient: boolean = !isServer; 