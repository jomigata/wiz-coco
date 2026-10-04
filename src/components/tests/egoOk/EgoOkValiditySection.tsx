'use client';

import {
  EGO_OK_REPORT_INNER_FRAME,
  EGO_OK_REPORT_INNER_HEADER_DIVIDER,
} from '@/components/tests/egoOk/egoOkReportChrome';
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

export default function EgoOkValiditySection({
  validity,
  embedded,
}: {
  validity: EgoOkValidityProfile;
  /** 탭 패널 안: 바깥 테두리와 m-2 간격에 맞춘 컴팩트 스타일 */
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? `${EGO_OK_REPORT_INNER_FRAME} p-2 shadow-none`
          : 'rounded-2xl border-2 border-white bg-slate-900/50 p-5 shadow-xl sm:p-6'
      }
    >
      <header className={embedded ? `${EGO_OK_REPORT_INNER_HEADER_DIVIDER} pb-2` : 'border-b border-white pb-4'}>
        <h2 className="text-lg font-semibold text-white">검사 타당도 및 반응 태도 분석</h2>
        <p className="mt-1 text-xs text-slate-500">Test Validity Profile · 타당도 문항 15·30·47·63·77·90번 분산</p>
      </header>

      <div
        className={
          embedded
            ? `mt-2 rounded-lg border border-white bg-black/30 p-2`
            : 'mt-4 rounded-lg border border-white bg-black/25 p-4'
        }
      >
        <p className="text-sm font-semibold text-slate-200">
          [ 종합 판정 ]{' '}
          <span className={trafficColor(validity.overall)}>
            {trafficDot(validity.overall)} {validity.overallTitle}
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{validity.overallSummary}</p>
        <p className="mt-2 text-[11px] text-slate-500">
          판정 기준: ● 정상(유효) · ▲ 주의(조건부 해석) · ■ 무효(재검사 권고)
        </p>
      </div>

      <div className={`${embedded ? 'mt-2' : 'mt-6'} overflow-x-auto`}>
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
              <td className="py-2.5 pr-3 font-mono">
                {validity.imc.failCount} / 2개
              </td>
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

      {validity.counselorNotes.length > 0 ? (
        <div className="mt-6 space-y-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
          <h3 className="text-sm font-semibold text-indigo-100">상담사를 위한 임상적 해석 및 개입 가이드</h3>
          {validity.counselorNotes.map((note) => (
            <p key={note.slice(0, 28)} className="text-sm leading-relaxed text-slate-300">
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
