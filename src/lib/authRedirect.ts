/**
 * 로그인 페이지 리다이렉트 URL 및 인증 오류 판별
 */

export function buildLoginRedirectUrl(returnPath?: string): string {
  if (typeof window === 'undefined') return '/login';
  const path = (returnPath || `${window.location.pathname}${window.location.search}`).trim();
  if (!path || path.startsWith('/login') || path.startsWith('/register')) {
    return '/login';
  }
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export function isLoginRequiredError(message: unknown): boolean {
  const text = String(message ?? '').trim();
  if (!text) return false;
  if (text.includes('로그인이 필요')) return true;
  if (text.includes('전문가·상담사 로그인') || text.includes('전문가 로그인')) return true;
  if (/unauthorized/i.test(text)) return true;
  if (/valid firebase id token/i.test(text)) return true;
  if (/id token required/i.test(text)) return true;
  return false;
}
