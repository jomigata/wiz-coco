import { isCounselorManageShellRoute } from '@/lib/counselorManageShell';

function normalizePath(pathname: string): string {
  return (pathname || '').split('?')[0].replace(/\/+$/, '') || '/counselor';
}

/** 상담관리 목록·현황 화면으로 이동할 때 스크롤을 맨 위로 (생성 폼 등 긴 페이지 이후 타이틀 가림 방지) */
export function shouldResetCounselorListScrollOnNavigate(pathname: string, search = ''): boolean {
  if (!isCounselorManageShellRoute(pathname, search)) return false;
  const path = normalizePath(pathname);
  if (path === '/counselor/assessments/new') return false;
  if (path.startsWith('/counselor/assessments/edit')) return false;
  return true;
}

export function resetCounselorListPageScroll(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll('[data-counselor-page-scroll]').forEach((node) => {
    if (node instanceof HTMLElement) node.scrollTop = 0;
  });
}
