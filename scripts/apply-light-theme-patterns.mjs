import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');
const skip = new Set(['.backup', '.working', 'tsbuildinfo']);

const replacements = [
  ['bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full', 'bg-[#f8fafc] p-6 min-h-full'],
  ['bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900', 'bg-[#f8fafc]'],
  ['min-h-screen bg-gray-900', 'min-h-screen bg-[#f8fafc]'],
  ['bg-[#0b1120]', 'bg-[#f8fafc]'],
  ['bg-[#070b14]', 'bg-[#f8fafc]'],
  ['bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950 text-white', 'bg-[#f8fafc] text-slate-900'],
  ['bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950', 'bg-[#f8fafc]'],
  ['border-b border-white/10 bg-slate-950/90', 'border-b border-slate-200 bg-white/90'],
  ['border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800', 'border-b border-slate-200 bg-white'],
  ['min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900', 'min-h-screen bg-[#f8fafc]'],
  ['bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20', 'bg-white rounded-xl p-6 border border-slate-200 shadow-sm'],
  [
    'bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full',
    'bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex flex-col h-full',
  ],
  ['bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10', 'bg-slate-50 rounded-xl p-6 border border-slate-200'],
  ['bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20', 'bg-white rounded-xl p-8 shadow-sm border border-slate-200'],
  ['bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20', 'bg-white rounded-xl p-6 shadow-sm border border-slate-200'],
  ['rounded-lg border border-white/10 bg-white/[0.06]', 'rounded-lg border border-slate-200 bg-white shadow-sm'],
  ['border border-white/10 bg-white/[0.06]', 'border border-slate-200 bg-white'],
  ['rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm', 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm'],
  ['relative flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm', 'relative flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm'],
  ['text-4xl font-bold text-white mb-2', 'text-4xl font-bold text-slate-900 mb-2'],
  ['text-3xl font-bold text-white', 'text-3xl font-bold text-slate-900'],
  ['text-2xl font-bold text-white', 'text-2xl font-bold text-slate-900'],
  ['text-xl font-semibold tracking-tight text-white', 'text-xl font-semibold tracking-tight text-slate-900'],
  ['text-xl sm:text-2xl font-semibold tracking-tight text-white', 'text-xl sm:text-2xl font-semibold tracking-tight text-slate-900'],
  ['text-lg font-semibold text-white', 'text-lg font-semibold text-slate-900'],
  ['text-lg font-semibold text-slate-100', 'text-lg font-semibold text-slate-900'],
  ['text-gray-300 text-lg', 'text-slate-600 text-lg'],
  ['text-gray-300 text-sm', 'text-slate-600 text-sm'],
  ['text-blue-200 mb-4', 'text-slate-600 mb-4'],
  ['text-xl text-blue-200', 'text-xl text-slate-600'],
  ['bg-black/20 rounded-lg', 'bg-slate-100 rounded-lg'],
  ['w-10 h-10 bg-white/10 rounded-lg', 'w-10 h-10 bg-slate-100 rounded-lg border border-slate-200'],
  ['border-b border-white/10 mb-2', 'border-b border-slate-200 mb-2'],
  ['text-white bg-white/10 border border-b-0 border-white/15', 'text-slate-900 bg-white border border-b-0 border-slate-200'],
  ['text-slate-400 hover:text-slate-200', 'text-slate-500 hover:text-slate-800'],
  ['text-center py-12 bg-white/5 rounded-lg border border-white/10', 'text-center py-12 bg-slate-50 rounded-lg border border-slate-200'],
  ['bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10', 'bg-slate-50 rounded-xl p-6 border border-slate-200'],
  ['w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm', 'select-theme-light w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm'],
  ['px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm', 'select-theme-light px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm'],
  ['className="bg-blue-900 text-white"', 'className="bg-white text-slate-900"'],
  ['fixed inset-x-0 top-16 bottom-0 z-30 hidden bg-[#050810]/55', 'fixed inset-x-0 top-16 bottom-0 z-30 hidden bg-slate-900/15'],
  ['bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20', 'bg-white rounded-xl p-8 border border-slate-200 shadow-sm'],
  ['bg-white/10 backdrop-blur-sm rounded-xl border border-white/20', 'bg-white rounded-xl border border-slate-200 shadow-sm'],
  ['rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm', 'rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm'],
  ['text-gray-300 text-lg">전문 관리 시스템', 'text-slate-600 text-lg">전문 관리 시스템'],
  ['bg-white/15 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg border border-white/20', 'bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200'],
  ['bg-white/10 p-4 rounded-lg border border-white/15', 'bg-slate-50 p-4 rounded-lg border border-slate-200'],
  ['bg-white/5 rounded-lg p-4 border border-white/10', 'bg-slate-50 rounded-lg p-4 border border-slate-200'],
  ['bg-white/5 p-4 rounded-lg border border-white/10', 'bg-slate-50 p-4 rounded-lg border border-slate-200'],
  ['border-white/10 bg-white/[0.03]', 'border-slate-200 bg-white'],
  ['border-white/10 bg-white/[0.02]', 'border-slate-200 bg-white'],
  ['border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5', 'border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50'],
  ['border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-200', 'select-theme-light border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900'],
  ['border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200', 'border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900'],
  ['border border-white/10 bg-white/5 px-3 py-2 text-sm text-white', 'border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900'],
  ['rounded border-white/20', 'rounded border-slate-300'],
  ['overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50', 'overflow-x-auto rounded-xl border border-slate-200 bg-white'],
  ['border-b border-white/10 text-left text-xs text-slate-500', 'border-b border-slate-200 text-left text-xs text-slate-500'],
  ['hover:bg-white/[0.02]', 'hover:bg-slate-50'],
  ['hover:bg-white/[0.03]', 'hover:bg-slate-50'],
  ['rounded-xl border border-white/10 bg-slate-900/80 p-8', 'rounded-xl border border-slate-200 bg-white p-8 shadow-sm'],
  ['flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5', 'flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50'],
  ['border-white/10 text-slate-300 hover:border-white/25', 'border-slate-200 text-slate-600 hover:border-blue-300'],
  ['ml-1.5 font-medium text-slate-200', 'ml-1.5 font-medium text-slate-700'],
  ['rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-200', 'rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700'],
  ['bg-slate-900/90 rounded-2xl border border-white/[0.08] p-8 shadow-2xl shadow-black/30', 'bg-white rounded-2xl border border-slate-200 p-8 shadow-lg shadow-slate-200/60'],
  ['block text-sm font-medium text-slate-300 mb-2', 'block text-sm font-medium text-slate-700 mb-2'],
  ['w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-lg tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50', 'w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-center text-lg tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40'],
  ['w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50', 'w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-center text-2xl tracking-[0.5em] placeholder:text-slate-400 placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/40'],
  ['text-2xl font-semibold text-white mb-2 tracking-tight', 'text-2xl font-semibold text-slate-900 mb-2 tracking-tight'],
  ['text-sky-400 hover:text-sky-300', 'text-blue-600 hover:text-blue-700'],
  ['text-emerald-300/80', 'text-emerald-600'],
  ['text-sky-300/80', 'text-blue-600'],
  ['rounded-xl border border-white/10 bg-slate-950/50', 'rounded-xl border border-slate-200 bg-white shadow-sm'],
  ['rounded-xl border border-white/10 bg-slate-950/60', 'rounded-xl border border-slate-200 bg-white shadow-sm'],
  ['rounded-xl border border-white/10 bg-slate-950/40', 'rounded-xl border border-slate-200 bg-white shadow-sm'],
  ['rounded-xl border border-white/10 bg-white/5', 'rounded-xl border border-slate-200 bg-slate-50'],
  ['rounded-lg border border-white/5 bg-white/[0.02]', 'rounded-lg border border-slate-200 bg-slate-50'],
  ['border-b border-white/10', 'border-b border-slate-200'],
  ['border-t border-white/10', 'border-t border-slate-200'],
  ['border border-white/15 text-slate-300 hover:bg-white/5', 'border border-slate-200 text-slate-600 hover:bg-slate-50'],
  ['border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5', 'border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50'],
  ['border border-white/15 px-3 py-1.5 text-xs text-slate-400', 'border border-slate-200 px-3 py-1.5 text-xs text-slate-500'],
  ['border border-white/15 px-3 py-2 text-xs text-slate-300', 'border border-slate-200 px-3 py-2 text-xs text-slate-600'],
  ['border border-white/15 px-3 py-1.5 text-xs text-sky-300 hover:bg-white/5', 'border border-slate-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50'],
  ['border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white', 'border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900'],
  ['border border-white/10', 'border border-slate-200'],
  ['border-white/5', 'border-slate-100'],
  ['bg-slate-950/60', 'bg-white'],
  ['bg-slate-950/98', 'bg-white'],
  ['border border-blue-400/30 bg-slate-950/98', 'border border-slate-200 bg-white'],
  ['rounded-2xl border border-white/10 bg-slate-900/80 p-8', 'rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'],
  ['bg-white/5 p-4 rounded-lg flex items-center justify-between border border-white/10', 'bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-200'],
  ['bg-white/15 backdrop-blur-md rounded-xl p-6 mt-6 shadow-lg border border-white/20', 'bg-white rounded-xl p-6 mt-6 shadow-sm border border-slate-200'],
  ['hover:border-white/20 hover:bg-white/[0.05]', 'hover:border-slate-300 hover:bg-slate-50'],
  ['transition hover:bg-white/10', 'transition hover:bg-slate-100'],
  ['border border-white/5 bg-black/20', 'border border-slate-200 bg-slate-100'],
  ['max-h-48 overflow-y-auto rounded-lg border border-white/10', 'max-h-48 overflow-y-auto rounded-lg border border-slate-200'],
  ['border-white/20', 'border-slate-200'],
  ['border-white/15', 'border-slate-200'],
  ['border-white/10', 'border-slate-200'],
  ['border-white/08', 'border-slate-200'],
  ['bg-white/[0.06]', 'bg-white'],
  ['bg-white/[0.05]', 'bg-slate-50'],
  ['bg-white/[0.04]', 'bg-slate-50'],
  ['bg-white/[0.03]', 'bg-slate-50'],
  ['bg-white/[0.02]', 'bg-slate-50'],
  ['hover:bg-white/5', 'hover:bg-slate-50'],
  ['hover:bg-white/10', 'hover:bg-slate-100'],
  ['bg-slate-900/80', 'bg-white'],
  ['bg-slate-900/90', 'bg-white'],
  ['bg-slate-950/50', 'bg-white'],
  ['bg-slate-950/40', 'bg-white'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts|css)$/.test(entry.name) && !entry.name.includes('.backup')) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log('updated:', path.relative(process.cwd(), file));
  }
}
console.log(`Done. ${changed} files updated.`);
