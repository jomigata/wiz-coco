/**
 * WizCoCo 라이트 디자인 토큰
 * 굿마인드(밝은 검사 포털) + Mediyn(심플 SaaS) 벤치마킹
 */
export const WIZ_COLORS = {
  page: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  primary: '#2563eb',
  primarySoft: '#eff6ff',
  accent: '#0ea5e9',
  accentSoft: '#e0f2fe',
} as const;

/** 홈·일반 페이지 카드 (Mediyn 스타일) */
export const wizCardClasses = {
  base: 'rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm',
  hover: 'transition-colors duration-300 hover:border-sky-200 hover:shadow-md',
  muted: 'rounded-2xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm',
} as const;

/** 섹션 타이포 */
export const wizSectionClasses = {
  eyebrow: 'text-[11px] uppercase tracking-[0.18em] text-slate-500',
  title: 'text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight',
  subtitle: 'text-slate-600 text-sm md:text-base leading-relaxed',
  link: 'text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors',
} as const;

/** CTA 버튼 */
export const wizButtonClasses = {
  primary:
    'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white bg-blue-600 shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg transition-all',
  secondary:
    'inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all',
  outline:
    'inline-flex justify-center items-center px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors',
} as const;
