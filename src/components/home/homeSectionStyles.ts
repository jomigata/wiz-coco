/** 홈페이지 공통 남색 톤 — 섹션마다 미세하게 다르지만 같은 계열 */
export const HOME_PAGE_BG = '#090d18';

export const homeSectionDivider =
  'pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent';

export const homeSectionTones = {
  hero: {
    section: 'bg-[#090d18]',
    bottomFade: 'from-transparent to-[#0a101c]',
    glow: 'bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(56,100,180,0.22),transparent)]',
    glowSecondary: 'bg-[radial-gradient(ellipse_45%_35%_at_85%_55%,rgba(88,60,140,0.1),transparent)]',
  },
  steps: {
    section: 'bg-[#0a101c]',
    bottomFade: 'from-transparent to-[#0b111d]',
    glow: 'bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(50,80,130,0.1),transparent)]',
  },
  faq: {
    section: 'bg-[#0b111d]',
    bottomFade: 'from-transparent to-[#0a0f1c]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_20%_100%,rgba(40,65,110,0.08),transparent)]',
  },
  trust: {
    section: 'bg-[#0a0f1c]',
    bottomFade: 'from-transparent to-[#0c121f]',
    glow: 'bg-[radial-gradient(ellipse_55%_35%_at_80%_0%,rgba(56,120,160,0.07),transparent)]',
  },
  channel: {
    section: 'bg-[#0c121f]',
    bottomFade: 'from-transparent to-[#0a101c]',
    glow: 'bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(45,75,125,0.08),transparent)]',
  },
  pricing: {
    section: 'bg-[#0a101c]',
    bottomFade: 'from-transparent to-[#0b111d]',
    glow: 'bg-[radial-gradient(ellipse_60%_35%_at_50%_0%,rgba(55,90,140,0.07),transparent)]',
  },
  monetizationTrust: {
    section: 'bg-[#0b111d]',
    bottomFade: 'from-transparent to-[#0c0f1a]',
    glow: 'bg-[radial-gradient(ellipse_50%_30%_at_50%_50%,rgba(40,100,90,0.06),transparent)]',
  },
  partner: {
    section: 'bg-[#0c0f1a]',
    bottomFade: 'from-transparent to-[#080b14]',
    glow: 'bg-[radial-gradient(ellipse_65%_50%_at_50%_100%,rgba(60,70,130,0.12),transparent)]',
  },
} as const;

export type HomeSectionTone = keyof typeof homeSectionTones;
