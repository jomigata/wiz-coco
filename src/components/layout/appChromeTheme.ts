import { WIZ_COLORS } from '@/components/layout/wizDesignTokens';

/** 전역 상단·본문·하단 크롬 색상 (홈·일반 페이지 공통) */
export const APP_PAGE_BG = WIZ_COLORS.page;

export const appChromeClasses = {
  page: 'bg-[#f8fafc] text-slate-900',
  header:
    'border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/60 backdrop-blur-md',
  headerFade: 'from-white/80',
  mainTopFade: 'from-slate-50/80',
  footer:
    'border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.06)]',
  footerHeight: 'h-10 sm:h-11',
} as const;

/** 고정 하단 푸터 높이만큼 본문 하단 여백 */
export const APP_FOOTER_OFFSET_CLASS = 'pb-10 sm:pb-11';

/** 데스크톱 네비게이션 크롬 */
export const navChromeClasses = {
  header: appChromeClasses.header,
  brandTitle:
    'font-semibold text-xl sm:text-2xl tracking-tight text-slate-900 transition-colors duration-300 leading-none group-hover:text-blue-700 whitespace-nowrap',
  brandSubtitle:
    'mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide whitespace-nowrap group-hover:text-slate-600',
  navIdle:
    'text-slate-600 hover:text-blue-700 hover:bg-blue-50 border-transparent hover:border-blue-200',
  navOpen: 'text-slate-700 border-blue-300 bg-blue-50',
  navActive: 'text-white bg-blue-600 border-blue-600',
  mobilePanel: 'bg-white border-b border-slate-200 shadow-xl',
  mobileHamburger: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  logoRing: 'ring-1 ring-slate-200',
} as const;

/** 메가 메뉴 패널 — 화이트 카드 (Mediyn 드롭다운 스타일) */
export const NAV_MEGA_MENU_BG = WIZ_COLORS.surface;

export const navMegaMenuClasses = {
  panel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-hidden rounded-2xl border border-slate-200 bg-white pb-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 animate-fadeIn',
  cascadingPanel:
    'absolute top-full z-[60] -mt-px pt-3 w-auto overflow-visible rounded-2xl border border-slate-200 bg-white pb-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 animate-fadeIn',
  cascadingCol: 'w-80 min-w-[20rem] max-w-[24rem] px-4 py-3',
  cascadingLeafFlyout:
    'absolute left-full top-0 z-[70] w-[calc(20rem+0.5rem)] min-w-[18.5rem] max-w-[22.5rem] animate-fadeIn pl-2',
  cascadingLeafFlyoutInner:
    'rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.1)] ring-1 ring-slate-100',
  panelSizeFull: 'min-w-[48rem] max-w-[56rem]',
  panelSizeMainOnly: 'min-w-[20rem] max-w-[24rem]',
  panelGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,rgba(37,99,235,0.06),transparent)]',
  leftCol: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 border-r border-slate-100 px-5 py-3',
  leftColSolo: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 px-5 py-3',
  rightCol: 'w-96 min-w-[24rem] max-w-[28rem] shrink-0 px-5 py-3',
  panelTitle: 'mb-4 text-base font-semibold tracking-tight text-slate-700',
  mainItemActive: 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm',
  mainItemIdle:
    'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm',
  subItemActive: 'border-blue-400 bg-blue-50/80',
  subItemIdle: 'border-slate-200 hover:border-blue-300 hover:bg-slate-50',
  leafItemActive: 'border-blue-400',
  leafItemIdle: 'border-slate-200 hover:border-blue-300',
  textAccent: 'text-slate-700 group-hover:text-slate-900',
  textMuted: 'text-slate-500 group-hover:text-slate-600',
} as const;

/** 마이페이지·상담관리 드롭다운 공통 */
export const navDropdownClasses = {
  panel:
    'absolute top-full z-[60] -mt-px w-96 min-w-[24rem] max-w-[28rem] rounded-2xl border border-slate-200 bg-white pt-3 pb-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] animate-fadeIn',
  title: 'mb-2 text-base font-semibold tracking-tight text-slate-700',
  item: 'group flex items-center gap-4 rounded-xl border-2 border-transparent px-4 py-3 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/60',
  itemTitle: 'truncate font-medium text-slate-900',
  itemDesc: 'truncate text-xs text-slate-500',
  itemArrow: 'h-4 w-4 shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600',
  profileCard: 'mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4',
  profileName: 'font-semibold text-slate-900',
  profileEmail: 'text-sm text-slate-500',
} as const;

/** 상담관리 허브 페이지 — 라이트 톤 (홈과 일관) */
export const counselorHubClasses = {
  page: 'bg-[#f8fafc]',
  pageGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.06),transparent)]',
  hero: 'rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm',
  subsection: 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm',
  subsectionHeader: 'border-b border-slate-100 pb-4',
  item: 'rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm',
  itemIcon: 'rounded-lg border border-slate-200 bg-white',
  footerNote: 'rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5',
  statCard: 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center',
} as const;
