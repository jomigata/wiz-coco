'use client';

import { useEffect } from 'react';
import { setupBrowserCloseHandler } from '@/utils/localStorageManager';

export default function ClientLayoutHandler() {
  useEffect(() => {
    // 브라우저 종료 시 개인정보 삭제 핸들러 설정
    setupBrowserCloseHandler();
    
    console.log('[ClientLayoutHandler] 브라우저 종료 시 개인정보 삭제 핸들러 설정 완료');
  }, []);

  return null; // 렌더링할 UI 없음
} 