/** 전역 상단·본문·하단 크롬 색상 (홈·일반 페이지 공통) */
export const APP_PAGE_BG = '#0f1628';

export const appChromeClasses = {
  page: 'bg-[#0f1628] text-slate-100',
  header:
    'border-b border-white/[0.06] bg-[#121c32] shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
  headerFade: 'from-[#121c32]',
  mainTopFade: 'from-[#121c32]',
  footer:
    'border-t border-white/[0.07] bg-[#0c1220] shadow-[0_-6px_28px_rgba(0,0,0,0.28)]',
  footerHeight: 'h-16',
} as const;

/** 고정 하단 푸터 높이만큼 본문 하단 여백 */
export const APP_FOOTER_OFFSET_CLASS = 'pb-16';

/** 상단 헤더(#121c32)보다 한 단계 밝은 남청 블루 — 메가 메뉴 패널 전용 */
export const NAV_MEGA_MENU_BG = '#162b4a';

/** 상담관리 허브 페이지 — 서브메뉴와 동일 톤, 중·소분류 계층 배경 */
export const counselorHubClasses = {
  page: 'bg-[#162b4a]',
  pageGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(72,130,210,0.14),transparent)]',
  hero: 'rounded-2xl border border-sky-400/15 bg-[#1a3358] p-6 sm:p-8',
  subsection: 'rounded-2xl border border-sky-400/12 bg-[#1a3358] p-5 sm:p-6',
  subsectionHeader: 'border-b border-sky-400/10 pb-4',
  item: 'rounded-xl border border-sky-400/10 bg-[#101f38] px-4 py-3.5 transition-all duration-300 hover:border-sky-300/35 hover:bg-[#142847]',
  itemIcon: 'rounded-lg border border-sky-400/10 bg-[#162b4a]',
  footerNote: 'rounded-2xl border border-dashed border-sky-400/15 bg-[#142847]/60 p-5',
  statCard: 'rounded-xl border border-sky-400/12 bg-[#142847] px-4 py-3 text-center',
} as const;

/** 데스크톱 3단 메가 메뉴 패널 — 헤더와 톤은 맞추되 배경은 한 단계 밝게 */
export const navMegaMenuClasses = {
  panel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-hidden rounded-2xl border border-sky-400/15 bg-[#162b4a] pb-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-sky-300/[0.06] animate-fadeIn',
  /** 상담관리: 대→중(아래)→소(옆) 단계형 — overflow visible로 소분류 플라이아웃 허용 */
  cascadingPanel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-visible rounded-2xl border border-sky-400/15 bg-[#162b4a] pb-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-sky-300/[0.06] animate-fadeIn',
  cascadingCol: 'w-80 min-w-[20rem] max-w-[24rem] px-4 py-3',
  cascadingLeafFlyout:
    'absolute left-full top-0 z-[70] w-[calc(20rem+0.5rem)] min-w-[18.5rem] max-w-[22.5rem] animate-fadeIn pl-2',
  cascadingLeafFlyoutInner:
    'rounded-xl border border-sky-400/15 bg-[#162b4a] p-3 shadow-[0_16px_48px_rgba(0,0,0,0.5)] ring-1 ring-sky-300/[0.06]',
  /** 대·중·소 2열 */
  panelSizeFull: 'min-w-[48rem] max-w-[56rem]',
  /** 대분류만 (중·소분류 열 숨김) */
  panelSizeMainOnly: 'min-w-[20rem] max-w-[24rem]',
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
