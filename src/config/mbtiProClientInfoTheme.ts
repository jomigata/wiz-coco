export type MbtiProClientInfoTheme = {
  showOrbs: boolean;
  shell: string;
  subtitle: string;
  formCard: string;
  sectionBox: string;
  genderPanel: string;
  label: string;
  input: string;
  choiceIdle: string;
  choiceSelected: string;
  yearPanel: string;
  yearGrid: string;
  yearSelected: string;
  yearIdle: string;
  yearSelectedRing: string;
  yearSelectedBar: string;
  privacyBox: string;
  privacyLabel: string;
  privacyHint: string;
  checkbox: string;
  backBtn: string;
  submitBtn: string;
  footerHint: string;
  focusRingOffset: string;
};

const emerald: MbtiProClientInfoTheme = {
  showOrbs: true,
  shell: 'min-h-screen bg-emerald-950 text-white py-4 px-4 overflow-hidden relative pt-16',
  subtitle: 'text-emerald-300',
  formCard: 'bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8',
  sectionBox: 'bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30',
  genderPanel: 'bg-teal-500/15 p-4 rounded-lg border border-teal-400/20',
  label: 'text-emerald-300',
  input:
    'w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors',
  choiceIdle: 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70',
  choiceSelected: 'bg-teal-600 text-white border-2 border-teal-500',
  yearPanel: 'year-selector mt-2 z-50 bg-emerald-900/95 backdrop-blur-sm border border-emerald-700 rounded-lg p-4 shadow-lg',
  yearGrid:
    'grid grid-cols-10 gap-x-2 gap-y-1 overflow-y-auto max-h-[336px] scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-emerald-900/50',
  yearSelected: 'bg-emerald-600 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/40',
  yearIdle: 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70',
  yearSelectedRing: 'ring-emerald-300/30',
  yearSelectedBar: 'bg-emerald-300/45',
  privacyBox: 'bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30 hover:bg-emerald-800/40 transition-colors',
  privacyLabel: 'text-emerald-200',
  privacyHint: 'text-emerald-300/80',
  checkbox: 'w-4 h-4 text-emerald-600 bg-emerald-900 border-emerald-500 rounded focus:ring-emerald-500 focus:ring-2',
  backBtn:
    'px-5 py-3 font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-900 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  submitBtn:
    'px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900',
  footerHint: 'text-emerald-400/70',
  focusRingOffset: 'focus:ring-offset-emerald-900',
};

const portal: MbtiProClientInfoTheme = {
  showOrbs: false,
  shell: 'min-h-screen bg-[#070b14] text-white py-4 px-4 overflow-hidden relative pt-16',
  subtitle: 'text-slate-400',
  formCard: 'bg-slate-900/90 border border-white/[0.08] rounded-xl shadow-lg p-8',
  sectionBox: 'bg-slate-800/40 p-4 rounded-lg border border-white/[0.08]',
  genderPanel: 'bg-slate-800/35 p-4 rounded-lg border border-white/[0.08]',
  label: 'text-slate-300',
  input:
    'w-full px-4 py-3 rounded-lg bg-slate-800/70 border border-white/[0.12] text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors',
  choiceIdle: 'bg-slate-900/50 text-slate-300 border border-white/[0.12] hover:bg-slate-800/70',
  choiceSelected: 'bg-sky-600/90 text-white border-2 border-sky-400 shadow-lg shadow-sky-500/25',
  yearPanel:
    'year-selector mt-2 z-50 bg-slate-900/95 backdrop-blur-sm border border-white/[0.12] rounded-lg p-4 shadow-lg',
  yearGrid:
    'grid grid-cols-10 gap-x-2 gap-y-1 overflow-y-auto max-h-[336px] scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-slate-900/50',
  yearSelected: 'bg-sky-600 text-white border-2 border-sky-400 shadow-lg shadow-sky-500/30',
  yearIdle: 'bg-slate-800/70 text-slate-300 border border-white/[0.12] hover:bg-slate-700/70',
  yearSelectedRing: 'ring-sky-300/35',
  yearSelectedBar: 'bg-sky-300/50',
  privacyBox:
    'bg-slate-800/40 p-4 rounded-lg border border-white/[0.08] hover:bg-slate-800/55 transition-colors',
  privacyLabel: 'text-slate-200',
  privacyHint: 'text-slate-400',
  checkbox: 'w-4 h-4 text-sky-500 bg-slate-900 border-sky-500/60 rounded focus:ring-sky-500 focus:ring-2',
  backBtn:
    'px-5 py-3 font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070b14] bg-slate-800/80 text-slate-200 hover:bg-slate-700 focus:ring-sky-500',
  submitBtn:
    'px-6 py-3 bg-sky-600 text-white font-medium rounded-lg shadow-md hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#070b14]',
  footerHint: 'text-slate-500',
  focusRingOffset: 'focus:ring-offset-[#070b14]',
};

export function getMbtiProClientInfoTheme(uiTheme: 'emerald' | 'portal' = 'emerald'): MbtiProClientInfoTheme {
  return uiTheme === 'portal' ? portal : emerald;
}
