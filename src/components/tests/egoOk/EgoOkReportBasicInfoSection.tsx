'use client';

import type { EgoOkReport } from '@/lib/egoOkScoring';
import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';

function pct(raw: number, max: number): string {
  if (max <= 0) return '—';
  return `${Math.round((raw / max) * 1000) / 10}%`;
}

export default function EgoOkReportBasicInfoSection({
  report,
  clientInfo,
  displayGenderLine,
}: {
  report: EgoOkReport;
  clientInfo: ClientInfo | null;
  displayGenderLine: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-800">기본 정보</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-400">성명</dt>
            <dd className="font-medium text-slate-900">{clientInfo?.name?.trim() || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-400">성별 · 출생</dt>
            <dd className="font-medium text-slate-900">{displayGenderLine}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-400">243 패턴</dt>
            <dd className="font-mono text-lg font-bold tracking-widest text-indigo-700">{report.patternCode}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-400">인생태도</dt>
            <dd className="font-semibold text-slate-900">{report.lifePosition.kind}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-4 ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-800">이고그램 · 5척도 종합 (50문항)</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                <th className="py-2 pr-2">척도</th>
                <th className="py-2 pr-2 text-right">합계</th>
                <th className="py-2 pr-2 text-right">긍정</th>
                <th className="py-2 pr-2 text-right">부정</th>
                <th className="py-2 text-right">합계%</th>
              </tr>
            </thead>
            <tbody>
              {report.egogram.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-bold">{s.id}</td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">{s.raw}</td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">{s.positiveRaw}</td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">{s.negativeRaw}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{pct(s.raw, 50)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-4 ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-800">오케이그램 · 4척도 (40문항)</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                <th className="py-2 pr-2">형태</th>
                <th className="py-2 pr-2 text-right">점수</th>
                <th className="py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {report.okgram.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-bold">{s.id}</td>
                  <td className="py-2 pr-2 text-right font-mono tabular-nums">
                    {s.raw} / 50
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums">{pct(s.raw, 50)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
