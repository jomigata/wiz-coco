import { isClientPortalLinkEntryPath } from '@/lib/clientPortalLinkEntryPaths';
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';

type RouterLike = { push: (href: string) => void };

/** 검사시작 화면 이동 — 다른 탭 세션 정리 후 이동 */
export function navigateToClientPortalLogin(router: RouterLike, href = '/portal/login/'): void {
  void resetAllSessionsBeforePortalLinkEntry().then(() => {
    router.push(href);
  });
}

export function isPortalLoginHref(href: string): boolean {
  if (!href) return false;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://wizcoco.com';
    const url = new URL(href, base);
    return isClientPortalLinkEntryPath(url.pathname);
  } catch {
    return isClientPortalLinkEntryPath(href.split('?')[0] || '');
  }
}
