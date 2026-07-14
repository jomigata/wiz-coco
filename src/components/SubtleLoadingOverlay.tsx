'use client';

/**
 * 이전 콘텐츠를 유지한 채 위에 얕은 블러·딤을 얹어 동기화 중임을 표시합니다.
 */
export default function SubtleLoadingOverlay({
  show,
  label = '불러오는 중…',
  hint = '최신 자료를 연결하는 동안 이전 화면을 유지합니다.',
}: {
  show: boolean;
  label?: string;
  hint?: string;
}) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center rounded-xl border border-slate-200 bg-[#0f172a]/85 px-6 py-4 text-center shadow-lg backdrop-blur-md">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        <p className="mt-3 text-sm font-medium text-slate-100">{label}</p>
        <p className="mt-1 text-xs leading-snug text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
