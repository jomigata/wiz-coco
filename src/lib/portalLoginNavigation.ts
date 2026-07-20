import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';

type RouterLike = { push: (href: string) => void };

/** 같은 탭에서 검사시작 화면으로 이동 — 다른 탭은 유지 */
export function navigateToClientPortalLogin(router: RouterLike, href = '/portal/login/'): void {
  void resetAllSessionsBeforePortalLinkEntry({ notifyOtherTabs: false }).then(() => {
    router.push(href);
  });
}
