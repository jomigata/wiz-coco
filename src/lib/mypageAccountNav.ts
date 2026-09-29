export type MypageAccountNavItem = {
  href: string;
  label: string;
  description: string;
};

export const MYPAGE_HOME_HREF = '/mypage';

export const mypageAccountDetailNav: MypageAccountNavItem[] = [
  {
    href: '/mypage/account/profile',
    label: '프로필·연락처',
    description: '이름, 휴대폰, 전문 정보, 기관·보고서',
  },
  {
    href: '/mypage/account/privacy',
    label: '공개·개인정보',
    description: '프로필 공개 범위',
  },
  {
    href: '/mypage/account/role',
    label: '역할·상담사',
    description: '상담사 모드 전환 및 신청',
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
