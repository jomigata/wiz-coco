export type MypageAccountNavItem = {
  href: string;
  label: string;
  description: string;
};

export const MYPAGE_DEFAULT_HREF = '/mypage/account/info';

export const mypageAccountDetailNav: MypageAccountNavItem[] = [
  {
    href: '/mypage/account/info',
    label: '개인 정보',
    description: '로그인·개인 기본 정보',
  },
  {
    href: '/mypage/account/counselor',
    label: '상담사 계정',
    description: '승인·등록·경력·연락처',
  },
  {
    href: '/mypage/account/organization',
    label: '회사/기관 정보',
    description: '기관명·사업자·연락처·주소',
  },
  {
    href: '/mypage/account/counselor-profile',
    label: '상담사 프로필',
    description: '전문 분야·소개',
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
