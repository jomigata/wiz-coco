'use client';

import React from 'react';

/**
 * 본문만 갈아끼우고 전역 상단 메뉴는 유지하는 구조에 맞춰,
 * 라우트 전환 시 전역 블러·스피너 오버레이는 사용하지 않습니다.
 * (전환 오버레이가 상단 메뉴까지 새로고침되는 느낌을 줄 수 있음)
 */
export default function RouteTransitionShell({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-0 flex-1">{children}</div>;
}
