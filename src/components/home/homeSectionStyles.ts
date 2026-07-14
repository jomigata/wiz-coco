import { APP_PAGE_BG } from '@/components/layout/appChromeTheme';

/** 홈페이지 공통 밝은 톤 — 상단·하단 크롬과 자연스럽게 이어지는 계열 */
export const HOME_PAGE_BG = APP_PAGE_BG;

export const homeSectionDivider =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-[2px] bg-gradient-to-r from-transparent via-sky-300/30 to-transparent';

export const homeSectionTopShade =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-14 bg-gradient-to-b from-white/50 via-white/20 to-transparent';

export const homeSectionTones = {
  hero: {
    section: 'bg-[#eef4f8]',
    bottomFade: 'from-transparent to-[#f3f7f4]',
    glow: 'bg-[radial-gradient(ellipse_85%_55%_at_50%_20%,rgba(100,155,200,0.2),transparent)]',
    glowSecondary: 'bg-[radial-gradient(ellipse_45%_35%_at_88%_55%,rgba(150,175,210,0.14),transparent)]',
    topBlend: 'bg-gradient-to-b from-white/60 to-transparent',
  },
  steps: {
    section: 'bg-[#f3f7f4]',
    bottomFade: 'from-transparent to-[#f6f8fb]',
    glow: 'bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(120,170,200,0.1),transparent)]',
  },
  faq: {
    section: 'bg-[#f6f8fb]',
    bottomFade: 'from-transparent to-[#f4f7fa]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_20%_100%,rgba(100,150,190,0.08),transparent)]',
  },
  trust: {
    section: 'bg-[#f4f7fa]',
    bottomFade: 'from-transparent to-[#f0f4f8]',
    glow: 'bg-[radial-gradient(ellipse_55%_35%_at_80%_0%,rgba(130,175,210,0.1),transparent)]',
  },
  channel: {
    section: 'bg-[#f0f4f8]',
    bottomFade: 'from-transparent to-[#f6f7f5]',
    glow: 'bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(110,160,195,0.09),transparent)]',
  },
  pricing: {
    section: 'bg-[#f6f7f5]',
    bottomFade: 'from-transparent to-[#fdf8f4]',
    glow: 'bg-[radial-gradient(ellipse_60%_35%_at_50%_0%,rgba(120,165,200,0.08),transparent)]',
  },
  monetizationTrust: {
    section: 'bg-[#fdf8f4]',
    bottomFade: 'from-transparent to-[#f2f6fa]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_50%_50%,rgba(140,180,160,0.08),transparent)]',
  },
  partner: {
    section: 'bg-[#f2f6fa]',
    glow: 'bg-[radial-gradient(ellipse_65%_50%_at_50%_100%,rgba(100,150,200,0.1),transparent)]',
  },
} as const;

export type HomeSectionTone = keyof typeof homeSectionTones;
