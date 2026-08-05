export type MbtiProClientInfoTheme = {
  shell: string;
  subtitle: string;
  formCard: string;
  fieldBox: string;
  fieldBoxMuted: string;
  label: string;
  input: string;
  choiceSection: string;
  choiceBtnActive: string;
  choiceBtnInactive: string;
  yearSelector: string;
  yearGrid: string;
  yearBtnBase: string;
  yearBtnSelected: string;
  yearBtnBgDefault: string;
  yearBtnBgBlueBand: string;
  yearBtnBorderHover: string;
  yearTextNormal: string;
  yearTextAccent: string;
  yearSelectedUnderline: string;
  yearSelectedRing: string;
  yearBtnHoverRgb: string;
  privacyBox: string;
  checkbox: string;
  privacyLabel: string;
  privacyHint: string;
  backBtn: string;
  backBtnDisabled: string;
  submitBtn: string;
  footer: string;
  showOrbs: boolean;
};

const emerald: MbtiProClientInfoTheme = {
  shell: 'fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-emerald-950 text-white px-3 pt-14 pb-14',
  subtitle: 'text-emerald-300 max-w-lg mx-auto text-sm',
  formCard: 'bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-5 sm:p-6',
  fieldBox: 'py-2.5',
  fieldBoxMuted: 'py-2.5',
  label: 'block text-sm font-medium text-emerald-300 mb-1.5',
  input:
    'w-full px-3 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors',
  choiceSection: 'py-2.5',
  choiceBtnActive: 'bg-teal-600 text-white border-2 border-teal-500',
  choiceBtnInactive:
    'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70',
  yearSelector:
    'year-selector mt-1.5 z-50 bg-emerald-900/95 backdrop-blur-sm border border-emerald-700 rounded-lg p-2 shadow-lg',
  yearGrid:
    'grid grid-cols-8 gap-x-1 gap-y-1 overflow-x-auto overflow-y-auto max-h-[272px] px-10 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-emerald-900/50',
  yearBtnBase:
    'relative flex items-center justify-center px-1.5 py-1.5 min-h-0 text-sm font-medium rounded transition-all',
  yearBtnSelected:
    'bg-emerald-600 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/40',
  yearBtnBgDefault: 'bg-emerald-800/70',
  yearBtnBgBlueBand: 'bg-sky-700/50',
  yearBtnBorderHover: 'border border-emerald-700 hover:bg-emerald-700/70',
  yearTextNormal: 'text-emerald-200',
  yearTextAccent: 'text-yellow-200',
  yearSelectedUnderline: 'bg-emerald-300/45',
  yearSelectedRing: 'ring-emerald-300/30',
  yearBtnHoverRgb: 'rgba(5, 150, 105, 0.3)',
  privacyBox: 'bg-emerald-800/30 p-3.5 rounded-lg border border-emerald-700/30 hover:bg-emerald-800/40 transition-colors',
  checkbox: 'w-4 h-4 text-emerald-600 bg-emerald-900 border-emerald-500 rounded focus:ring-emerald-500 focus:ring-2',
  privacyLabel: 'font-medium text-emerald-200 cursor-pointer select-none text-sm',
  privacyHint: 'text-emerald-300/80 mt-0.5 cursor-pointer select-none text-xs leading-snug',
  backBtn:
    'px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-900 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  backBtnDisabled:
    'px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-900 bg-gray-700/60 text-gray-200 hover:bg-gray-700 focus:ring-gray-500',
  submitBtn:
    'px-5 py-2 text-sm bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900',
  footer: 'mt-3 mb-0 text-center text-xs text-emerald-400/70 leading-snug space-y-0.5',
  showOrbs: true,
};

const portal: MbtiProClientInfoTheme = {
  shell: 'fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-[#060a12] text-white px-3 pt-14 pb-14',
  subtitle: 'text-slate-300 max-w-lg mx-auto text-sm',
  formCard: 'rounded-2xl border border-white/[0.14] bg-[#182438] shadow-xl shadow-black/30 p-5 sm:p-6',
  fieldBox: 'py-2.5',
  fieldBoxMuted: 'py-2.5',
  label: 'block text-sm font-medium text-sky-200/95 mb-1.5',
  input:
    'w-full px-3 py-3 rounded-lg bg-sky-950/45 border border-sky-500/45 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/60 transition-colors',
  choiceSection: 'py-2.5',
  choiceBtnActive: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white border border-sky-400/30',
  choiceBtnInactive:
    'bg-[#1a2740] text-slate-200 border border-white/[0.12] hover:bg-[#1f2f4d]',
  yearSelector:
    'year-selector mt-1.5 z-50 bg-sky-900/95 backdrop-blur-sm border border-sky-600/65 rounded-lg p-2 shadow-lg shadow-black/30',
  yearGrid:
    'grid grid-cols-10 gap-x-0.5 gap-y-0.5 overflow-y-auto max-h-[272px] px-1 scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-sky-950/80',
  yearBtnBase:
    'relative flex items-center justify-center px-0.5 py-1.5 min-h-0 text-sm sm:text-base font-medium rounded transition-all',
  yearBtnSelected:
    'bg-sky-500 text-white border-2 border-sky-300 shadow-lg shadow-sky-400/45 scale-[1.08] z-[1]',
  yearBtnBgDefault: 'bg-sky-950/45 text-sky-100/80',
  yearBtnBgBlueBand: 'bg-blue-950/90 text-sky-100/95 border border-blue-800/50',
  yearBtnBorderHover: 'border border-sky-500/45 hover:border-sky-400/55 hover:bg-sky-950/55',
  yearTextNormal: 'text-sky-100',
  yearTextAccent: 'text-sky-50 font-semibold',
  yearSelectedUnderline: 'bg-sky-300/45',
  yearSelectedRing: 'ring-sky-300/35',
  yearBtnHoverRgb: 'rgba(14, 165, 233, 0.35)',
  privacyBox:
    'rounded-xl border border-white/[0.14] bg-[#1a2740] p-3.5 hover:bg-[#1f2f4d] transition-colors',
  checkbox: 'w-4 h-4 text-sky-500 bg-slate-900 border-sky-500/50 rounded focus:ring-sky-500 focus:ring-2',
  privacyLabel: 'font-medium text-slate-200 cursor-pointer select-none text-sm',
  privacyHint: 'text-slate-400 mt-0.5 cursor-pointer select-none text-xs leading-snug',
  backBtn:
    'px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070b14] bg-slate-800/80 text-slate-200 hover:bg-slate-700 focus:ring-sky-500',
  backBtnDisabled:
    'px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070b14] bg-slate-800/50 text-slate-400 focus:ring-slate-600',
  submitBtn:
    'px-5 py-2 text-sm bg-sky-600 text-white font-medium rounded-lg shadow-md hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#070b14]',
  footer: 'mt-3 mb-0 text-center text-xs text-slate-500 leading-snug space-y-0.5',
  showOrbs: false,
};

export function getMbtiProClientInfoTheme(uiTheme: 'emerald' | 'portal' = 'emerald'): MbtiProClientInfoTheme {
  return uiTheme === 'portal' ? portal : emerald;
}

export const YEAR_GRID_COLS = 10;
export const YEAR_GRID_VISIBLE_ROWS = 8;
