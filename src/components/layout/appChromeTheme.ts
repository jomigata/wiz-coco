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
