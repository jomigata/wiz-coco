'use client';

import { ReportInsightBlock } from '@/components/tests/egoOk/egoOkReportInsight';
import type { EgoOkValidityProfile, ValidityScaleStatus, ValidityTraffic } from '@/lib/egoOkValidity';

function trafficDot(overall: ValidityTraffic): string {
  if (overall === 'normal') return '●';
  if (overall === 'caution') return '▲';
  return '■';
}

function trafficColor(overall: ValidityTraffic): string {
  if (overall === 'normal') return 'text-emerald-400';
  if (overall === 'caution') return 'text-amber-400';
  return 'text-rose-400';
}

function statusKo(status: ValidityScaleStatus): string {
  if (status === 'normal') return '정상';
  if (status === 'caution') return '주의';
  return '무효';
}

function statusClass(status: ValidityScaleStatus): string {
  if (status === 'normal') return 'text-emerald-300';
  if (status === 'caution') return 'text-amber-300';
  return 'text-rose-300';
}

export function ValidityTable({ validity }: { validity: EgoOkValidityProfile }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left text-xs text-slate-300">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-semibold">구분</th>
            <th className="py-2 pr-3 font-semibold">측정 문항</th>
            <th className="py-2 pr-3 font-semibold">원점수</th>
            <th className="py-2 pr-3 font-semibold">상태</th>
            <th className="py-2 font-semibold">해석 기준</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <tr>
            <td className="py-2.5 pr-3 font-medium text-white">반응 성실도 (IMC)</td>
            <td className="py-2.5 pr-3">{validity.imc.itemNos.join('번, ')}번</td>
            <td className="py-2.5 pr-3 font-mono">{validity.imc.failCount} / 2개</td>
            <td className={`py-2.5 pr-3 font-semibold ${statusClass(validity.imc.status)}`}>
              {statusKo(validity.imc.status)}
            </td>
            <td className="py-2.5 text-slate-400">{validity.imc.detail}</td>
          </tr>
          <tr>
            <td className="py-2.5 pr-3 font-medium text-white">사회적 바람직성 (L)</td>
            <td className="py-2.5 pr-3">{validity.lie.itemNos.join('번, ')}번</td>
            <td className="py-2.5 pr-3 font-mono">
              {validity.lie.raw} / {validity.lie.max}점
            </td>
            <td className={`py-2.5 pr-3 font-semibold ${statusClass(validity.lie.status)}`}>
              {statusKo(validity.lie.status)}
            </td>
            <td className="py-2.5 text-slate-400">{validity.lie.detail}</td>
          </tr>
          <tr>
            <td className="py-2.5 pr-3 font-medium text-white">비전형 왜곡 (F)</td>
            <td className="py-2.5 pr-3">{validity.infreq.itemNos.join('번, ')}번</td>
            <td className="py-2.5 pr-3 font-mono">
              {validity.infreq.raw} / {validity.infreq.max}점
            </td>
            <td className={`py-2.5 pr-3 font-semibold ${statusClass(validity.infreq.status)}`}>
              {statusKo(validity.infreq.status)}
            </td>
            <td className="py-2.5 text-slate-400">{validity.infreq.detail}</td>
          </tr>
          <tr>
            <td className="py-2.5 pr-3 font-medium text-white">일관성 (VRIN)</td>
            <td className="py-2.5 pr-3">대립 {validity.vrin.pairCount}개 문항쌍</td>
            <td className="py-2.5 pr-3 font-mono">
              {validity.vrin.mismatchPairs} / {validity.vrin.maxPairs}점
            </td>
            <td className={`py-2.5 pr-3 font-semibold ${statusClass(validity.vrin.status)}`}>
              {statusKo(validity.vrin.status)}
            </td>
            <td className="py-2.5 text-slate-400">{validity.vrin.detail}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function EgoOkValiditySection({
  validity,
  embedded,
}: {
  validity: EgoOkValidityProfile;
  embedded?: boolean;
}) {
  if (embedded) {
    return (
      <div className="flex flex-col gap-3">
        <ReportInsightBlock
          tone="indigo"
          title="검사 타당도 및 반응 태도 분석"
        >
          <p className="text-xs text-slate-500">Test Validity Profile · 타당도 문항 15·30·47·63·77·90번 분산</p>
        </ReportInsightBlock>
        <ReportInsightBlock tone="amber" title="종합 판정">
          <p className="text-sm font-semibold text-slate-200">
            <span className={trafficColor(validity.overall)}>
              {trafficDot(validity.overall)} {validity.overallTitle}
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{validity.overallSummary}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            판정 기준: ● 정상(유효) · ▲ 주의(조건부 해석) · ■ 무효(재검사 권고)
          </p>
        </ReportInsightBlock>
        <ReportInsightBlock tone="sky" title="타당도 지표">
          <ValidityTable validity={validity} />
        </ReportInsightBlock>
        {validity.counselorNotes.length > 0 ? (
          <ReportInsightBlock tone="violet" title="상담사를 위한 임상적 해석 및 개입 가이드">
            {validity.counselorNotes.map((note) => (
              <p key={note.slice(0, 28)} className="mt-2 text-sm leading-relaxed text-slate-300 first:mt-0">
                {note}
              </p>
            ))}
          </ReportInsightBlock>
        ) : null}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-white bg-slate-900/50 p-5 shadow-xl sm:p-6">
      <header className="border-b border-white pb-4">
        <h2 className="text-lg font-semibold text-white">검사 타당도 및 반응 태도 분석</h2>
        <p className="mt-1 text-xs text-slate-500">Test Validity Profile · 타당도 문항 15·30·47·63·77·90번 분산</p>
      </header>
      <div className="mt-4 rounded-lg border border-white bg-black/25 p-4">
        <p className="text-sm font-semibold text-slate-200">
          [ 종합 판정 ]{' '}
          <span className={trafficColor(validity.overall)}>
            {trafficDot(validity.overall)} {validity.overallTitle}
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{validity.overallSummary}</p>
      </div>
      <div className="mt-6">
        <ValidityTable validity={validity} />
      </div>
    </section>
  );
}
