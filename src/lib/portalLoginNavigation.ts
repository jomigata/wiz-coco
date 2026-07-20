import { markInternalNavigation } from '@/utils/authSessionLifecycle';

type RouterLike = { push: (href: string) => void };

/** 같은 탭 검사시작 — 전문가는 로그아웃 없이 이동 (세션 정리는 /portal/login 진입 시 처리) */
export function navigateToClientPortalLogin(router: RouterLike, href = '/portal/login/'): void {
  markInternalNavigation();
  router.push(href);
}
