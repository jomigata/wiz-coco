import { WIZ_COLORS } from '@/components/layout/wizDesignTokens';

/** 홈페이지 공통 배경 — 밝은 슬레이트 톤 */
export const HOME_PAGE_BG = WIZ_COLORS.page;

export const homeSectionDivider =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent';

export const homeSectionTopShade =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-8 bg-gradient-to-b from-slate-100/80 to-transparent';

export const homeSectionTones = {
  hero: {
    section: 'bg-white',
    bottomFade: 'from-transparent to-[#f8fafc]',
    glow: 'bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(37,99,235,0.08),transparent)]',
    glowSecondary: 'bg-[radial-gradient(ellipse_45%_35%_at_85%_55%,rgba(14,165,233,0.05),transparent)]',
    topBlend: 'bg-gradient-to-b from-blue-50/40 to-transparent',
  },
  steps: {
    section: 'bg-[#f8fafc]',
    bottomFade: 'from-transparent to-white',
    glow: 'bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(37,99,235,0.04),transparent)]',
  },
  faq: {
    section: 'bg-white',
    bottomFade: 'from-transparent to-[#f8fafc]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_20%_100%,rgba(14,165,233,0.04),transparent)]',
  },
  trust: {
    section: 'bg-[#f8fafc]',
    bottomFade: 'from-transparent to-white',
    glow: 'bg-[radial-gradient(ellipse_55%_35%_at_80%_0%,rgba(37,99,235,0.04),transparent)]',
  },
  channel: {
    section: 'bg-white',
    bottomFade: 'from-transparent to-[#f8fafc]',
    glow: 'bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(37,99,235,0.04),transparent)]',
  },
  pricing: {
    section: 'bg-[#f8fafc]',
    bottomFade: 'from-transparent to-white',
    glow: 'bg-[radial-gradient(ellipse_60%_35%_at_50%_0%,rgba(37,99,235,0.04),transparent)]',
  },
  monetizationTrust: {
    section: 'bg-white',
    bottomFade: 'from-transparent to-[#f8fafc]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_50%_50%,rgba(16,185,129,0.04),transparent)]',
  },
  partner: {
    section: 'bg-[#f8fafc]',
    glow: 'bg-[radial-gradient(ellipse_65%_50%_at_50%_100%,rgba(37,99,235,0.05),transparent)]',
  },
} as const;

export type HomeSectionTone = keyof typeof homeSectionTones;
