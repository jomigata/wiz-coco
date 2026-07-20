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
  pageShell: 'bg-emerald-950 min-h-screen',
  subtitle: 'text-emerald-300',
  progressLabel: 'text-emerald-200',
  progressTrack: 'bg-emerald-800/50',
  progressFill: 'bg-emerald-500',
  mainCard: 'bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8',
  questionCard:
    'bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 flex items-center justify-center min-h-[120px] border border-emerald-700/20',
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
  pageShell: 'bg-[#070b14] min-h-screen',
  subtitle: 'text-slate-400',
  progressLabel: 'text-slate-300',
  progressTrack: 'bg-slate-800/80',
  progressFill: 'bg-sky-500',
  mainCard: 'bg-slate-900/90 border border-white/[0.08] rounded-xl shadow-lg p-8',
  questionCard:
    'bg-slate-800/50 rounded-xl p-6 mb-8 flex items-center justify-center min-h-[120px] border border-white/[0.08]',
  scaleArc: 'absolute top-0 left-0 right-0 h-24 bg-slate-800/30 rounded-[100%/20px] -z-10',
  answerBtn: 'bg-slate-900/50 transition-all duration-300 border border-white/[0.08]',
  answerBtnHover: 'hover:bg-slate-800/70 hover:translate-y-[-2px]',
  checkDot: 'bg-sky-500',
  answerCircle: 'bg-sky-600/90',
  answerLabel: 'text-sky-300/90',
  resumeOuter: 'min-h-screen bg-[#070b14] flex items-center justify-center p-4 pt-16',
  resumeCard:
    'bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-white/[0.08]',
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
  if (flowShell) return `${flowShell} min-h-screen`;
  return getMbtiProVisualTheme(uiTheme).pageShell;
}
