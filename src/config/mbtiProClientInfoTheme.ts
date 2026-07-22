export type MbtiProClientInfoTheme = {
  showOrbs: boolean;
  page: string;
  subtitle: string;
  card: string;
  section: string;
  label: string;
  input: string;
  yearPanel: string;
  yearGridScroll: string;
  yearBtnSelected: string;
  yearBtnIdle: string;
  genderSection: string;
  choiceActive: string;
  choiceIdle: string;
  privacyBox: string;
  privacyLabel: string;
  privacyHint: string;
  checkbox: string;
  submitPrimary: string;
  footerHint: string;
  orbA: string;
  orbB: string;
  orbC: string;
};

const emerald: MbtiProClientInfoTheme = {
  showOrbs: true,
  page: 'min-h-screen bg-emerald-950 text-white py-4 px-4 overflow-hidden relative pt-16',
  subtitle: 'text-emerald-300 max-w-lg mx-auto',
  card: 'bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8',
  section: 'bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30',
  label: 'block text-sm font-medium text-emerald-300 mb-1',
  input:
    'w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors',
  yearPanel:
    'year-selector mt-2 z-50 bg-emerald-900/95 backdrop-blur-sm border border-emerald-700 rounded-lg p-4 shadow-lg',
  yearGridScroll:
    'grid grid-cols-10 gap-x-2 gap-y-1 overflow-y-auto max-h-[336px] scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-emerald-900/50',
  yearBtnSelected:
    'bg-emerald-600 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/40',
  yearBtnIdle:
    'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70',
  genderSection: 'bg-teal-500/15 p-4 rounded-lg border border-teal-400/20',
  choiceActive: 'bg-teal-600 text-white border-2 border-teal-500',
  choiceIdle: 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70',
  privacyBox: 'bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30',
  privacyLabel: 'font-medium text-emerald-200 cursor-pointer select-none',
  privacyHint: 'text-emerald-300/80 mt-1 cursor-pointer select-none',
  checkbox:
    'w-4 h-4 text-emerald-600 bg-emerald-900 border-emerald-500 rounded focus:ring-emerald-500 focus:ring-2',
  submitPrimary:
    'px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900',
  footerHint: 'mt-8 text-center text-sm text-emerald-400/70',
  orbA:
    'absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob',
  orbB:
    'absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000',
  orbC:
    'absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000',
};

const portal: MbtiProClientInfoTheme = {
  showOrbs: false,
  page: 'min-h-screen bg-[#070b14] text-white py-4 px-4 overflow-hidden relative pt-16',
  subtitle: 'text-slate-400 max-w-lg mx-auto',
  card: 'bg-slate-950/60 backdrop-blur-sm rounded-xl border border-blue-400/25 shadow-lg p-8',
  section: 'bg-slate-900/50 p-4 rounded-xl border border-white/[0.08]',
  label: 'block text-sm font-medium text-sky-300/90 mb-1',
  input:
    'w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-blue-400/25 text-white placeholder:text-blue-300/40 focus:ring-1 focus:ring-sky-400/30 focus:border-sky-400/60 transition-colors',
  yearPanel:
    'year-selector mt-2 z-50 bg-slate-950/98 backdrop-blur-xl border border-blue-400/30 rounded-xl p-4 shadow-2xl',
  yearGridScroll:
    'grid grid-cols-10 gap-x-2 gap-y-1 overflow-y-auto max-h-[336px] scrollbar-thin scrollbar-thumb-sky-600/80 scrollbar-track-slate-900/50',
  yearBtnSelected: 'bg-sky-600 text-white border-2 border-sky-400 shadow-lg shadow-sky-500/30',
  yearBtnIdle:
    'bg-slate-900/70 text-slate-200 border border-blue-400/20 hover:bg-slate-800/80',
  genderSection: 'bg-slate-900/40 p-4 rounded-xl border border-white/[0.08]',
  choiceActive: 'bg-sky-600 text-white border-2 border-sky-400',
  choiceIdle:
    'bg-slate-950/60 text-slate-200 border border-blue-400/20 hover:bg-slate-800/70',
  privacyBox: 'bg-slate-900/50 p-4 rounded-xl border border-white/[0.08]',
  privacyLabel: 'font-medium text-slate-200 cursor-pointer select-none',
  privacyHint: 'text-slate-400 mt-1 cursor-pointer select-none',
  checkbox:
    'w-4 h-4 text-sky-500 bg-slate-900 border-blue-400/40 rounded focus:ring-sky-500 focus:ring-2',
  submitPrimary:
    'px-6 py-3 bg-sky-600 text-white font-medium rounded-lg shadow-md hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:ring-offset-2 focus:ring-offset-[#070b14]',
  footerHint: 'mt-8 text-center text-sm text-slate-500',
  orbA: '',
  orbB: '',
  orbC: '',
};

export function getMbtiProClientInfoTheme(uiTheme: 'emerald' | 'portal' = 'emerald'): MbtiProClientInfoTheme {
  return uiTheme === 'portal' ? portal : emerald;
}
