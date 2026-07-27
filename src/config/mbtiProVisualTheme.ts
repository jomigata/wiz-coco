export type MbtiProVisualTheme = {
  showOrbs: boolean;
  pageShell: string;
  subtitle: string;
  progressLabel: string;
  progressTrack: string;
  progressFill: string;
  mainCard: string;
  questionCard: string;
  scaleArc: string;
  answerBtn: string;
  answerBtnHover: string;
  checkDot: string;
  answerCircle: string;
  answerLabel: string;
  resumeOuter: string;
  resumeCard: string;
  resumeBody: string;
  resumePanel: string;
  resumeTrack: string;
  resumeFill: string;
  resumeHint: string;
  resumeBtnSecondary: string;
  resumeBtnPrimary: string;
};

const emerald: MbtiProVisualTheme = {
  showOrbs: true,
  pageShell: 'bg-emerald-950 min-h-0',
  subtitle: 'text-emerald-300 text-sm',
  progressLabel: 'text-emerald-200 text-sm',
  progressTrack: 'bg-emerald-800/50',
  progressFill: 'bg-emerald-500',
  mainCard: 'bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-5',
  questionCard:
    'bg-emerald-800/50 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center min-h-[72px] border border-emerald-700/20',
  scaleArc: 'absolute top-0 left-0 right-0 h-24 bg-emerald-900/10 rounded-[100%/20px] -z-10',
  answerBtn:
    'bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20',
  answerBtnHover: 'hover:bg-emerald-800/60 hover:translate-y-[-2px]',
  checkDot: 'bg-emerald-500',
  answerCircle: 'bg-emerald-600',
  answerLabel: 'text-emerald-400',
  resumeOuter: 'min-h-screen bg-emerald-950 flex items-center justify-center p-4 pt-16',
  resumeCard:
    'bg-emerald-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-emerald-700',
  resumeBody: 'text-emerald-200',
  resumePanel: 'bg-emerald-800/50',
  resumeTrack: 'bg-emerald-900',
  resumeFill: 'bg-emerald-500',
  resumeHint: 'text-emerald-300/80',
  resumeBtnSecondary:
    'flex-1 px-4 py-3 bg-gray-700/60 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition-colors',
  resumeBtnPrimary:
    'flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors',
};

const portal: MbtiProVisualTheme = {
  showOrbs: false,
  pageShell: 'bg-[#060a12] min-h-0',
  subtitle: 'text-slate-300 text-sm',
  progressLabel: 'text-slate-200 text-sm',
  progressTrack: 'bg-white/[0.1]',
  progressFill: 'bg-gradient-to-r from-sky-500 to-indigo-500',
  mainCard: 'rounded-2xl border border-white/[0.14] bg-[#182438] shadow-xl shadow-black/30 p-4 sm:p-5',
  questionCard:
    'flex items-center justify-center min-h-[84px] px-5 py-4 rounded-xl border-2 border-sky-400/45 bg-gradient-to-b from-[#243552] to-[#182438] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(56,189,248,0.12),0_8px_28px_rgba(0,0,0,0.45)] ring-1 ring-sky-300/20',
  scaleArc: 'absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-sky-500/[0.05] to-transparent rounded-[100%/20px] -z-10',
  answerBtn:
    'bg-[#0d1420]/75 transition-all duration-300 border border-white/[0.06] shadow-none opacity-85',
  answerBtnHover: 'hover:bg-[#121a28]/85 hover:border-white/[0.1]',
  checkDot: 'bg-sky-500/80',
  answerCircle: 'bg-gradient-to-br from-sky-600/75 to-indigo-700/75 opacity-90',
  answerLabel: 'text-slate-400/70',
  resumeOuter: 'min-h-screen bg-[#080d18] flex items-center justify-center p-4 pt-16',
  resumeCard:
    'rounded-2xl border border-white/[0.12] bg-[#151f33] backdrop-blur-sm shadow-2xl p-8 max-w-md w-full',
  resumeBody: 'text-slate-300',
  resumePanel: 'bg-slate-800/50 rounded-lg',
  resumeTrack: 'bg-slate-900',
  resumeFill: 'bg-sky-500',
  resumeHint: 'text-slate-400',
  resumeBtnSecondary:
    'flex-1 px-4 py-3 bg-slate-800/80 text-slate-200 font-medium rounded-lg hover:bg-slate-700 transition-colors',
  resumeBtnPrimary:
    'flex-1 px-4 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-500 transition-colors',
};

export function getMbtiProVisualTheme(uiTheme: 'emerald' | 'portal' = 'emerald'): MbtiProVisualTheme {
  return uiTheme === 'portal' ? portal : emerald;
}

export function resolveMbtiProPageShell(
  flowShell: string | undefined,
  uiTheme: 'emerald' | 'portal',
): string {
  if (flowShell) return flowShell;
  return getMbtiProVisualTheme(uiTheme).pageShell;
}
