/** 내담자 검사코드·매직링크 진입 — 상담사 Firebase 세션 복구 금지 */
export function isClientPortalLinkEntryPath(pathname: string): boolean {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  if (path === '/go' || path.startsWith('/go/')) return true;
  if (path === '/portal/login') return true;
  if (path === '/join') return true;
  return false;
}

/** 동일 탭에서 검사시작 화면으로 이동 (/go 매직링크 제외) */
export function isSameTabPortalStartNavigationPath(pathname: string): boolean {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  return path === '/portal/login' || path === '/join';
}
