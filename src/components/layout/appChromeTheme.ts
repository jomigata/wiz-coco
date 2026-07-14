/** 전역 상단·본문·하단 크롬 색상 (홈·일반 페이지 공통) — 굿마인드형 은은한 밝은 톤 */
export const APP_PAGE_BG = '#f2f6fa';

/** AppChrome·홈 본문 배경 그라데이션 (단색 fallback: APP_PAGE_BG) */
export const APP_PAGE_BG_GRADIENT =
  'radial-gradient(ellipse 85% 55% at 50% 0%, rgba(120, 170, 210, 0.16), transparent 65%), radial-gradient(ellipse 50% 40% at 92% 18%, rgba(170, 195, 225, 0.18), transparent 55%), radial-gradient(ellipse 45% 35% at 8% 75%, rgba(140, 185, 165, 0.1), transparent 60%), linear-gradient(180deg, #eef4f8 0%, #f4f7fa 42%, #f0f4f8 100%)';

export const appChromeClasses = {
  page: 'text-slate-800',
  pageGradient: 'bg-[radial-gradient(ellipse_85%_55%_at_50%_0%,rgba(120,170,210,0.16),transparent_65%),radial-gradient(ellipse_50%_40%_at_92%_18%,rgba(170,195,225,0.18),transparent_55%),radial-gradient(ellipse_45%_35%_at_8%_75%,rgba(140,185,165,0.1),transparent_60%),linear-gradient(180deg,#eef4f8_0%,#f4f7fa_42%,#f0f4f8_100%)]',
  header:
    'border-b border-slate-200/80 bg-white/92 shadow-[0_4px_24px_rgba(30,60,100,0.08)] backdrop-blur-md',
  headerFade: 'from-white/80',
  mainTopFade: 'from-white/50',
  footer:
    'border-t border-slate-200/70 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(30,60,100,0.06)]',
  footerHeight: 'h-10 sm:h-11',
} as const;

/** 고정 하단 푸터 높이만큼 본문 하단 여백 */
export const APP_FOOTER_OFFSET_CLASS = 'pb-10 sm:pb-11';

/** 상단 네비게이션 — 밝은 헤더용 텍스트·호버 */
export const navChromeClasses = {
  logoText: 'text-slate-800 group-hover:text-sky-700',
  navItemIdle:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border-transparent hover:border-slate-200/80',
  navItemActive: 'text-white bg-blue-600 border-blue-500',
  mobileMenuBtn: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
} as const;

/** 메가 메뉴 패널 — 밝은 카드 톤 */
export const NAV_MEGA_MENU_BG = '#fafcfe';

/** 상담관리 허브 페이지 — 밝은 블루 계열, 중·소분류 계층 배경 */
export const counselorHubClasses = {
  page: 'bg-[#e8f0f8]',
  pageGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(100,150,210,0.14),transparent)]',
  hero: 'rounded-2xl border border-sky-200/70 bg-white/85 p-6 shadow-sm sm:p-8',
  subsection: 'rounded-2xl border border-sky-200/60 bg-white/75 p-5 shadow-sm sm:p-6',
  subsectionHeader: 'border-b border-sky-100 pb-4',
  item: 'rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3.5 transition-all duration-300 hover:border-sky-300/60 hover:bg-sky-50/80',
  itemIcon: 'rounded-lg border border-sky-100 bg-sky-50/80',
  footerNote: 'rounded-2xl border border-dashed border-sky-200/70 bg-sky-50/50 p-5',
  statCard: 'rounded-xl border border-sky-200/60 bg-white/90 px-4 py-3 text-center shadow-sm',
} as const;

/** 데스크톱 3단 메가 메뉴 패널 */
export const navMegaMenuClasses = {
  panel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-hidden rounded-2xl border border-slate-200/70 bg-white/98 pb-6 shadow-[0_24px_64px_rgba(30,60,100,0.12)] ring-1 ring-slate-100 animate-fadeIn',
  cascadingPanel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-visible rounded-2xl border border-slate-200/70 bg-white/98 pb-4 shadow-[0_24px_64px_rgba(30,60,100,0.12)] ring-1 ring-slate-100 animate-fadeIn',
  cascadingCol: 'w-80 min-w-[20rem] max-w-[24rem] px-4 py-3',
  cascadingLeafFlyout:
    'absolute left-full top-0 z-[70] w-[calc(20rem+0.5rem)] min-w-[18.5rem] max-w-[22.5rem] animate-fadeIn pl-2',
  cascadingLeafFlyoutInner:
    'rounded-xl border border-slate-200/70 bg-white/98 p-3 shadow-[0_16px_40px_rgba(30,60,100,0.1)] ring-1 ring-slate-100',
  panelSizeFull: 'min-w-[48rem] max-w-[56rem]',
  panelSizeMainOnly: 'min-w-[20rem] max-w-[24rem]',
  panelGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,rgba(100,160,220,0.1),transparent)]',
  leftCol: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 border-r border-slate-200/60 px-5 py-3',
  leftColSolo: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 px-5 py-3',
  rightCol: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 px-5 py-3',
  panelTitle: 'mb-4 text-base font-semibold tracking-tight text-slate-500',
  mainItemActive: 'border-sky-400/70 bg-sky-50 text-slate-900 shadow-sm',
  mainItemIdle:
    'border-slate-200/60 text-slate-600 hover:border-sky-300/70 hover:bg-sky-50/80 hover:text-slate-900 hover:shadow-sm',
  subItemActive: 'border-sky-400/60 bg-sky-50/90',
  subItemIdle: 'border-slate-200/50 hover:border-sky-300/60 hover:bg-sky-50/60',
  leafItemActive: 'border-sky-400/60',
  leafItemIdle: 'border-slate-200/50 hover:border-sky-300/60',
  textAccent: 'text-slate-700 group-hover:text-slate-900',
  textMuted: 'text-slate-500 group-hover:text-slate-600',
} as const;

/** 홈·일반 페이지 카드·제목 (밝은 배경용) */
export const homeContentClasses = {
  sectionEyebrow: 'text-[11px] uppercase tracking-[0.18em] text-sky-600/80',
  sectionTitle: 'text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight',
  sectionSubtitle: 'text-slate-600 text-sm md:text-base leading-relaxed',
  card: 'rounded-2xl border border-slate-200/70 bg-white/85 p-6 md:p-7 shadow-sm hover:border-sky-200/80 hover:shadow-md transition-all duration-300',
  cardCompact: 'rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm',
  cardTitle: 'font-medium text-slate-800',
  cardBody: 'text-slate-600 text-sm leading-relaxed',
} as const;
