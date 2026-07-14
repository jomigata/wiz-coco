/** 홈페이지 공통 남색 톤 — 상단·하단 크롬과 자연스럽게 이어지는 계열 (기존보다 한 단계 밝게) */
export const HOME_PAGE_BG = '#0f1628';

export const homeSectionDivider =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-[2px] bg-gradient-to-r from-transparent via-sky-300/28 to-transparent';

export const homeSectionTopShade =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-14 bg-gradient-to-b from-black/18 via-black/6 to-transparent';

export const homeSectionTones = {
  hero: {
    section: 'bg-[#0e1525]',
    bottomFade: 'from-transparent to-[#111c32]',
    glow: 'bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(56,100,180,0.24),transparent)]',
    glowSecondary: 'bg-[radial-gradient(ellipse_45%_35%_at_85%_55%,rgba(88,60,140,0.1),transparent)]',
    topBlend: 'bg-gradient-to-b from-[#121c32]/35 to-transparent',
  },
  steps: {
    section: 'bg-[#111c32]',
    bottomFade: 'from-transparent to-[#0f1728]',
    glow: 'bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(50,80,130,0.14),transparent)]',
  },
  faq: {
    section: 'bg-[#0f1728]',
    bottomFade: 'from-transparent to-[#131e36]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_20%_100%,rgba(40,65,110,0.12),transparent)]',
  },
  trust: {
    section: 'bg-[#131e36]',
    bottomFade: 'from-transparent to-[#121a30]',
    glow: 'bg-[radial-gradient(ellipse_55%_35%_at_80%_0%,rgba(56,120,160,0.11),transparent)]',
  },
  channel: {
    section: 'bg-[#121a30]',
    bottomFade: 'from-transparent to-[#11192e]',
    glow: 'bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(45,75,125,0.12),transparent)]',
  },
  pricing: {
    section: 'bg-[#11192e]',
    bottomFade: 'from-transparent to-[#131829]',
    glow: 'bg-[radial-gradient(ellipse_60%_35%_at_50%_0%,rgba(55,90,140,0.1),transparent)]',
  },
  monetizationTrust: {
    section: 'bg-[#131829]',
    bottomFade: 'from-transparent to-[#0e141f]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_50%_50%,rgba(40,100,90,0.09),transparent)]',
  },
  partner: {
    section: 'bg-[#0e141f]',
    glow: 'bg-[radial-gradient(ellipse_65%_50%_at_50%_100%,rgba(60,70,130,0.12),transparent)]',
  },
} as const;

export type HomeSectionTone = keyof typeof homeSectionTones;
