'use client';

import { ReportInsightBlock } from '@/components/tests/egoOk/egoOkReportInsight';
import {
  VALIDITY_SCALE_META,
  type EgoOkValidityProfile,
  type ValidityScaleId,
  type ValidityScaleStatus,
  type ValidityTraffic,
} from '@/lib/egoOkValidity';

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

const BAND_CLASS: Record<ValidityScaleStatus, string> = {
  normal: 'text-emerald-300',
  caution: 'text-amber-300',
  invalid: 'text-rose-300',
};

function CriterionCell({ scaleId }: { scaleId: ValidityScaleId }) {
  const meta = VALIDITY_SCALE_META[scaleId];
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      <p className="text-slate-200">
        <span className="mr-1.5 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-100">
          기능
        </span>
        {meta.functionText}
      </p>
      <ul className="space-y-0.5">
        {meta.bands.map((band) => (
          <li key={band.status} className="flex gap-2">
            <span className={`w-8 shrink-0 font-semibold ${BAND_CLASS[band.status]}`}>{statusKo(band.status)}</span>
            <span className="text-slate-300">{band.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValidityTable({ validity }: { validity: EgoOkValidityProfile }) {
  const rows: {
    scaleId: ValidityScaleId;
    items: string;
    score: string;
    status: ValidityScaleStatus;
  }[] = [
    {
      scaleId: 'imc',
      items: `${validity.imc.itemNos.join('번, ')}번`,
      score: `${validity.imc.failCount} / 2개`,
      status: validity.imc.status,
    },
    {
      scaleId: 'lie',
      items: `${validity.lie.itemNos.join('번, ')}번`,
      score: `${validity.lie.raw} / ${validity.lie.max}점`,
      status: validity.lie.status,
    },
    {
      scaleId: 'infreq',
      items: `${validity.infreq.itemNos.join('번, ')}번`,
      score: `${validity.infreq.raw} / ${validity.infreq.max}점`,
      status: validity.infreq.status,
    },
    {
      scaleId: 'vrin',
      items: `대립 ${validity.vrin.pairCount}개 문항쌍`,
      score: `${validity.vrin.mismatchPairs} / ${validity.vrin.maxPairs}점`,
      status: validity.vrin.status,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-xs text-slate-300">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-semibold">구분</th>
            <th className="py-2 pr-3 font-semibold">측정 문항</th>
            <th className="py-2 pr-3 font-semibold">원점수</th>
            <th className="py-2 pr-3 font-semibold">상태</th>
            <th className="min-w-[16rem] py-2 font-semibold">해석 기준</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.scaleId} className="align-top">
              <td className="py-3 pr-3 font-medium text-white">{VALIDITY_SCALE_META[row.scaleId].label}</td>
              <td className="py-3 pr-3">{row.items}</td>
              <td className="py-3 pr-3 font-mono">{row.score}</td>
              <td className={`py-3 pr-3 font-semibold ${statusClass(row.status)}`}>{statusKo(row.status)}</td>
              <td className="py-3">
                <CriterionCell scaleId={row.scaleId} />
              </td>
            </tr>
          ))}
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
        <ReportInsightBlock tone="violet" title="상담사를 위한 임상적 해석 및 개입 가이드">
          <ul className="space-y-3">
            {validity.counselorNotes.map((note) => (
              <li key={note.scaleId} className="rounded-lg bg-black/25 p-3 ring-1 ring-white/10">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-violet-50">{note.label}</span>
                  <span className={`text-xs font-semibold ${statusClass(note.status)}`}>{statusKo(note.status)}</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{note.explanation}</p>
              </li>
            ))}
          </ul>
        </ReportInsightBlock>
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
