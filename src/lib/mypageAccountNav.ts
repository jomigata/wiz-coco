export type MypageAccountNavItem = {
  href: string;
  label: string;
  description: string;
};

export const MYPAGE_DEFAULT_HREF = '/mypage/account/info';

export const mypageAccountDetailNav: MypageAccountNavItem[] = [
  {
    href: '/mypage/account/info',
    label: '계정 정보',
    description: '로그인·개인 정보·역할',
  },
  {
    href: '/mypage/account/organization',
    label: '회사/기관 정보',
    description: '상담·운영·기관',
  },
  {
    href: '/mypage/account/report',
    label: '리포트 설정',
    description: '내담자용 정보 공개',
  },
];

export function isMypageShellRoute(pathname: string): boolean {
  const p = (pathname || '').replace(/\/+$/, '') || '/';
  if (p === '/mypage') return true;
  if (p.startsWith('/mypage/account')) return true;
  if (p === '/mypage/profile' || p === '/mypage/settings') return true;
  return false;
}

export function isMypageLegacyTabRoute(pathname: string, tab: string | null): boolean {
  if (pathname !== '/mypage' && pathname !== '/mypage/') return false;
  const t = (tab || '').trim();
  if (!t || t === 'profile') return false;
  return true;
}

export function isMypageAccountNavActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  const h = href.replace(/\/+$/, '') || '/';
  return p === h;
}
