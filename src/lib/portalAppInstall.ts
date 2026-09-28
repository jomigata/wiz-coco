/** 내 검사실 PWA(홈 화면 앱) 설치 유도 */

export function isPortalStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export const PORTAL_WEB_MANIFEST_PATH = '/wizcoco-portal.webmanifest';

export const PORTAL_APP_INSTALL_HINT =
  '홈 화면에 「내 검사실」을 추가하면 검사·숙제·결과 알림을 앱에서 바로 확인할 수 있습니다.';
