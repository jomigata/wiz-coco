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
    label: '상담사 정보',
    description: '기관·운영·전문 분야',
  },
  {
    href: '/mypage/account/report',
    label: '내담자용 정보',
    description: '결과지 표지·표기·전달',
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
