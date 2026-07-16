import type React from 'react';

export const FORM_INPUT =
  'w-full rounded-lg border border-white/10 bg-[#101f38]/90 px-3 py-2.5 text-base text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400/50 disabled:cursor-not-allowed disabled:opacity-55';
export const FORM_LABEL = 'mb-1.5 block text-sm font-semibold text-slate-300';
export const FORM_HINT = 'text-sm text-slate-400 leading-relaxed';
export const TEST_PICKER_SCROLL =
  'max-h-[14rem] overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-[#101f38]/60 p-3';
export const TEST_PICKER_FILL =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-[#101f38]/60 p-3';

export function openDatePicker(ref: React.RefObject<HTMLInputElement | null>) {
  const el = ref.current;
  if (!el || el.disabled) return;
  el.focus();
  if (typeof el.showPicker === 'function') {
    try {
      el.showPicker();
      return;
    } catch {
      /* Safari 등 */
    }
  }
  el.click();
}
