import type { ReactNode } from 'react';

/** 검사 코드 플로우는 로그인 없이 진입 가능. 제출·대시보드 API는 페이지에서 로그인을 요구합니다. */
export default function JoinLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
