export type PortalLoginIntent = 'start' | 'results';

export const PORTAL_LOGIN_COPY: Record<
  PortalLoginIntent,
  {
    title: string;
    description: string;
    submitLabel: string;
    loadingLabel: string;
    redirectPath: string;
    alternate?: { label: string; href: string };
  }
> = {
  start: {
    title: '검사시작',
    description: '안내 받으신 나의코드/비밀번호를 입력해 주세요.',
    submitLabel: '검사시작',
    loadingLabel: '확인 중…',
    redirectPath: '/portal/',
    alternate: {
      label: '완료한 검사 결과를 확인하려면',
      href: '/portal/login/?intent=results',
    },
  },
  results: {
    title: '검사 결과 확인',
    description: '검사 결과를 보려면 나의코드와 비밀번호를 입력해 주세요.',
    submitLabel: '결과 확인하기',
    loadingLabel: '결과 불러오는 중…',
    redirectPath: '/portal/?focus=results',
    alternate: {
      label: '검사를 새로 시작하려면',
      href: '/portal/login/',
    },
  },
};

export function parsePortalLoginIntent(raw: string | null | undefined): PortalLoginIntent {
  return raw === 'results' ? 'results' : 'start';
}

export function portalLoginHref(intent: PortalLoginIntent = 'start'): string {
  return intent === 'results' ? '/portal/login/?intent=results' : '/portal/login/';
}
