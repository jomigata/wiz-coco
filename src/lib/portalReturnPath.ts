/** 나의코드(포털) 진입 후 검사 제출·뒤로가기 시 복귀할 경로 */

export const PORTAL_RETURN_PATH_KEY = 'wizcoco_portal_return_path';

const DEFAULT_PORTAL_RETURN = '/portal/';

export const PORTAL_PROGRESS_PATH = DEFAULT_PORTAL_RETURN;

export function buildPortalProgressReturnUrl(expandKey?: string): string {
  if (!expandKey?.trim()) return PORTAL_PROGRESS_PATH;
  return `${PORTAL_PROGRESS_PATH}?expand=${encodeURIComponent(expandKey.trim())}`;
}

export function setPortalReturnPath(path: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = (path || '').trim();
  if (!trimmed.startsWith('/')) return;
  sessionStorage.setItem(PORTAL_RETURN_PATH_KEY, trimmed);
}

export function getPortalReturnPath(): string {
  if (typeof window === 'undefined') return DEFAULT_PORTAL_RETURN;
  try {
    const raw = sessionStorage.getItem(PORTAL_RETURN_PATH_KEY);
    if (raw && raw.startsWith('/')) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_PORTAL_RETURN;
}

export function clearPortalReturnPath(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PORTAL_RETURN_PATH_KEY);
}
