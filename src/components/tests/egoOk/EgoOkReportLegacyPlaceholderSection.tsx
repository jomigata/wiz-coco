'use client';

export default function EgoOkReportLegacyPlaceholderSection({
  title,
  legacyNo,
  description,
}: {
  title: string;
  legacyNo: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        학지사 결과지 No.{legacyNo}
      </p>
      <h3 className="mt-2 text-lg font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}
