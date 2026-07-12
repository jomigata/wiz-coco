/** 전역 상단·본문·하단 크롬 색상 (홈·일반 페이지 공통) */
export const APP_PAGE_BG = '#090d18';

export const appChromeClasses = {
  page: 'bg-[#090d18] text-slate-100',
  header:
    'border-b border-white/[0.06] bg-[#0a1020]/92 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md',
  headerFade: 'from-[#0a1020]/70',
  mainTopFade: 'from-[#0a1020]/50',
  footer:
    'border-t border-white/[0.07] bg-[#0c101c]/95 backdrop-blur-md shadow-[0_-6px_28px_rgba(0,0,0,0.28)]',
  footerHeight: 'h-10 sm:h-11',
} as const;

/** 고정 하단 푸터 높이만큼 본문 하단 여백 */
export const APP_FOOTER_OFFSET_CLASS = 'pb-10 sm:pb-11';

/** 상단 헤더(#0a1020)보다 한 단계 밝은 남청 블루 — 메가 메뉴 패널 전용 */
export const NAV_MEGA_MENU_BG = '#162b4a';

/** 데스크톱 3단 메가 메뉴 패널 — 헤더와 톤은 맞추되 배경은 한 단계 밝게 */
export const navMegaMenuClasses = {
  panel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-hidden rounded-2xl border border-sky-400/15 bg-[#162b4a] pb-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-sky-300/[0.06] animate-fadeIn',
  /** 대·중·소 2열 */
  panelSizeFull: 'min-w-[48rem] max-w-[56rem]',
  /** 대분류만 (중·소분류 열 숨김) */
  panelSizeMainOnly: 'min-w-[24rem] max-w-[28rem]',
  panelGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,rgba(72,130,210,0.16),transparent)]',
  leftCol: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 border-r border-white/[0.06] px-5 py-3',
  leftColSolo: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 px-5 py-3',
  rightCol: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 px-5 py-3',
  panelTitle: 'mb-4 text-base font-semibold tracking-tight text-slate-300',
  mainItemActive: 'border-white/70 bg-white/[0.08] text-white shadow-lg shadow-black/20',
  mainItemIdle:
    'border-white/10 text-slate-300 hover:border-white/35 hover:bg-white/[0.05] hover:text-white hover:shadow-md',
  subItemActive: 'border-white/70 bg-white/[0.06]',
  subItemIdle: 'border-white/10 hover:border-white/35 hover:bg-white/[0.04]',
  leafItemActive: 'border-white/60',
  leafItemIdle: 'border-white/10 hover:border-white/35',
  textAccent: 'text-slate-300 group-hover:text-white',
  textMuted: 'text-slate-500 group-hover:text-slate-300',
} as const;
