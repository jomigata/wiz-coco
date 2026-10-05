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

function CriteriaCell({ role, bands }: { role: string; bands: string[] }) {
  return (
    <div className="min-w-[16rem] max-w-md space-y-2 py-0.5">
      <p className="text-sm leading-relaxed text-slate-100">{role}</p>
      <ul className="space-y-1">
        {bands.map((band) => (
          <li
            key={band}
            className="rounded-md bg-black/30 px-2 py-1 text-xs leading-relaxed text-slate-200 ring-1 ring-white/10"
          >
            {band}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValidityTable({ validity }: { validity: EgoOkValidityProfile }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm text-slate-300">
        <thead>
          <tr className="border-b border-white/10 text-xs font-semibold text-slate-400">
            <th className="py-2 pr-3">구분</th>
            <th className="py-2 pr-3">측정 문항</th>
            <th className="py-2 pr-3">원점수</th>
            <th className="py-2 pr-3">상태</th>
            <th className="py-2">해석 기준</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          <tr>
            <td className="py-3 pr-3 align-top font-medium text-white">반응 성실도 (IMC)</td>
            <td className="py-3 pr-3 align-top">{validity.imc.itemNos.join('번, ')}번</td>
            <td className="py-3 pr-3 align-top font-mono">{validity.imc.failCount} / 2개</td>
            <td className={`py-3 pr-3 align-top font-semibold ${statusClass(validity.imc.status)}`}>
              {statusKo(validity.imc.status)}
            </td>
            <td className="py-3 align-top">
              <CriteriaCell
                role="지시된 답을 골랐는지 확인해, 문항을 읽지 않고 응답했는지 봅니다."
                bands={['정상: 두 문항 모두 지정 응답', '주의: 지정 응답 실패 1개', '무효: 지정 응답 실패 2개']}
              />
            </td>
          </tr>
          <tr>
            <td className="py-3 pr-3 align-top font-medium text-white">사회적 바람직성 (L)</td>
            <td className="py-3 pr-3 align-top">{validity.lie.itemNos.join('번, ')}번</td>
            <td className="py-3 pr-3 align-top font-mono">
              {validity.lie.raw} / {validity.lie.max}점
            </td>
            <td className={`py-3 pr-3 align-top font-semibold ${statusClass(validity.lie.status)}`}>
              {statusKo(validity.lie.status)}
            </td>
            <td className="py-3 align-top">
              <CriteriaCell
                role="자신을 사회적으로 좋아 보이게 답하는 경향을 봅니다."
                bands={['정상: 5점 이하', '주의: 6–7점', '무효: 8점 이상 (과도한 방어·위선)']}
              />
            </td>
          </tr>
          <tr>
            <td className="py-3 pr-3 align-top font-medium text-white">비전형 왜곡 (F)</td>
            <td className="py-3 pr-3 align-top">{validity.infreq.itemNos.join('번, ')}번</td>
            <td className="py-3 pr-3 align-top font-mono">
              {validity.infreq.raw} / {validity.infreq.max}점
            </td>
            <td className={`py-3 pr-3 align-top font-semibold ${statusClass(validity.infreq.status)}`}>
              {statusKo(validity.infreq.status)}
            </td>
            <td className="py-3 align-top">
              <CriteriaCell
                role="흔하지 않은 반응을 골라, 과장이나 무작위 응답 가능성을 봅니다."
                bands={['정상: 3점 이하', '주의: 4–5점', '무효: 6점 이상 (꾀병 또는 무작위 응답)']}
              />
            </td>
          </tr>
          <tr>
            <td className="py-3 pr-3 align-top font-medium text-white">일관성 (VRIN)</td>
            <td className="py-3 pr-3 align-top">대립 {validity.vrin.pairCount}개 문항쌍</td>
            <td className="py-3 pr-3 align-top font-mono">
              {validity.vrin.mismatchPairs} / {validity.vrin.maxPairs}점
            </td>
            <td className={`py-3 pr-3 align-top font-semibold ${statusClass(validity.vrin.status)}`}>
              {statusKo(validity.vrin.status)}
            </td>
            <td className="py-3 align-top">
              <CriteriaCell
                role="뜻이 반대인 문항에 함께 동의하는지 봐서, 답이 서로 맞는지 확인합니다."
                bands={['정상: 불일치 없음', '주의: 불일치 1쌍', '무효: 불일치 2쌍 이상 (비일관적)']}
              />
            </td>
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
        <ReportInsightBlock tone="violet" title="상담사를 위한 임상적 해석 및 개입 가이드">
          <ul className="space-y-3">
            {validity.counselorNotes.map((note) => (
              <li key={note.label} className="rounded-lg bg-black/20 px-3 py-2 ring-1 ring-white/10">
                <p className="text-sm font-semibold text-violet-100">{note.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-200">{note.body}</p>
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
