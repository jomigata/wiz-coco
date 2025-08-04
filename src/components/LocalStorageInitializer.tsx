'use client';

import { useEffect } from 'react';
import { initializeLocalStorage, printStorageGuidelines } from '@/utils/localStorageManager';

/**
 * 로컬스토리지 초기화 컴포넌트
 * 앱 시작 시 만료된 데이터 정리 및 DB 우선 정책 적용
 */
export default function LocalStorageInitializer() {
  useEffect(() => {
    // 앱 시작 시 로컬스토리지 초기화
    initializeLocalStorage();
    
    // 개발 환경에서만 가이드라인 출력
    if (process.env.NODE_ENV === 'development') {
      printStorageGuidelines();
    }
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
} 