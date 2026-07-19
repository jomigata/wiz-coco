'use client';

import React from 'react';

/** 상담관리 영역 공통 페이지 제목 (검사코드 목록 등 상단 h1) */
export default function CounselorPageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-3 shrink-0 text-xl font-bold tracking-tight text-white sm:text-2xl">{children}</h1>
  );
}
