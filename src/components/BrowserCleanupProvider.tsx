'use client';

import { useEffect } from 'react';
import { initBrowserCleanup } from '@/utils/browserCleanup';

export default function BrowserCleanupProvider() {
  useEffect(() => {
    // 브라우저 클린업 초기화 (로그인 정보 보존)
    const cleanup = initBrowserCleanup();

    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return cleanup;
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
} 