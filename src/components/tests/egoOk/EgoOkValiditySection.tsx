'use client';

import { ReportInsightBlock } from '@/components/tests/egoOk/egoOkReportInsight';
import { EGO_OK_ITEM_BANK_ID } from '@/data/egoOkQuestions';
import {
  VALIDITY_SCALE_LABELS,
  type EgoOkValidityProfile,
  type ValidityScaleStatus,
  type ValidityTraffic,
} from '@/lib/egoOkValidity';

const isEgoOk99Bank = EGO_OK_ITEM_BANK_ID === 'ego-ok-99';

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

function validitySpreadLabel(validity: EgoOkValidityProfile): string {
  const nos = [
    ...validity.imc.itemNos,
    ...validity.lie.itemNos,
    ...validity.infreq.itemNos,
  ].sort((a, b) => a - b);
  const count = nos.length;
  return `Test Validity Profile · 타당도 ${count}문항 분산 (${nos.join('·')})`;
}

function statusClass(status: ValidityScaleStatus): string {
  if (status === 'normal') return 'text-emerald-300';
  if (status === 'caution') return 'text-amber-300';
  return 'text-rose-300';
}

function CriteriaCell({ role, bands }: { role: string; bands?: string[] }) {
  return (
    <div className="min-w-[16rem] max-w-md space-y-2 py-0.5">
      <p className="text-sm leading-relaxed text-slate-100">{role}</p>
      {bands && bands.length > 0 ? (
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
      ) : null}
    </div>
  );
}

function ScaleMetricRow({
  label,
  measured,
  score,
  status,
  role,
  bands,
  guide,
}: {
  label: string;
  measured: string;
  score: string;
  status: ValidityScaleStatus;
  role: string;
  bands?: string[];
  guide?: string;
}) {
  return (
    <>
      <tr className={guide ? undefined : 'border-b border-white/10'}>
        <td className="pr-3 pt-3 align-top font-medium text-white">{label}</td>
        <td className="pr-3 pt-3 align-top">{measured}</td>
        <td className="pr-3 pt-3 align-top font-mono">{score}</td>
        <td className={`pr-3 pt-3 align-top font-semibold ${statusClass(status)}`}>{statusKo(status)}</td>
        <td className="py-3 align-top" rowSpan={guide ? 2 : 1}>
          <CriteriaCell role={role} bands={bands} />
        </td>
      </tr>
      {guide ? (
        <tr className="border-b border-white/10">
          <td colSpan={4} className="p-0">
            <div className="mx-2 mb-3 mt-2 rounded-lg bg-violet-500/15 px-3 py-2 ring-1 ring-violet-300/35">
              <p className="text-sm leading-relaxed text-slate-100">
                <span className="font-semibold text-violet-100">상담사 가이드용 : </span>
                {guide}
              </p>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function ValidityTable({
  validity,
  showScoreBands = true,
  showCounselorGuide = false,
}: {
  validity: EgoOkValidityProfile;
  /** 표지 세부 내역에서는 정상·주의·무효 줄을 숨김 */
  showScoreBands?: boolean;
  /** 타당도 탭 — 정상·주의·무효 왼쪽 칸에 상담 가이드 */
  showCounselorGuide?: boolean;
}) {
  const guideOf = (label: string) =>
    showCounselorGuide ? validity.counselorNotes.find((note) => note.label === label)?.body : undefined;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm text-slate-300">
        <thead>
          <tr className="border-b border-white/10 text-xs font-semibold text-slate-400">
            <th className="py-2 pr-3">구분</th>
            <th className="py-2 pr-3">측정 문항</th>
            <th className="py-2 pr-3">획득 / 전체</th>
            <th className="py-2 pr-3">상태</th>
            <th className="py-2">해석 기준</th>
          </tr>
        </thead>
        <tbody>
          <ScaleMetricRow
            label={VALIDITY_SCALE_LABELS.imc}
            measured={`${validity.imc.itemNos.join('번, ')}번`}
            score={
              isEgoOk99Bank
                ? `${validity.imc.failCount} / ${validity.imc.itemNos.length}개 (3점↓)`
                : `${validity.imc.failCount} / 2개`
            }
            status={validity.imc.status}
            role={
              isEgoOk99Bank
                ? '현실·주의·생활 상식 문항에 무성의하게 부정 응답했는지 봅니다.'
                : '지시된 답을 골랐는지 확인해, 문항을 읽지 않고 응답했는지 봅니다.'
            }
            bands={
              showScoreBands
                ? isEgoOk99Bank
                  ? ['정상: 3점 이하 0개', '주의: 3점 이하 1개', '무효: 3점 이하 2개 이상']
                  : ['정상: 두 문항 모두 지정 응답', '주의: 지정 응답 실패 1개', '무효: 지정 응답 실패 2개']
                : undefined
            }
            guide={guideOf(VALIDITY_SCALE_LABELS.imc)}
          />
          <ScaleMetricRow
            label={VALIDITY_SCALE_LABELS.lie}
            measured={`${validity.lie.itemNos.join('번, ')}번`}
            score={
              isEgoOk99Bank
                ? `${validity.lie.raw} / ${validity.lie.max}개 (2점↓)`
                : `${validity.lie.raw} / ${validity.lie.max}점`
            }
            status={validity.lie.status}
            role={
              isEgoOk99Bank
                ? '평범한 짜증·게으름·섭섭함까지 부인하는 도덕적 포장(위선) 경향을 봅니다.'
                : '자신을 사회적으로 좋아 보이게 답하는 경향을 봅니다.'
            }
            bands={
              showScoreBands
                ? isEgoOk99Bank
                  ? ['정상: 2점 이하 0–1개', '주의: 2점 이하 2개 (도덕적 포장)', '— (L 단독 무효 없음)']
                  : ['정상: 5점 이하', '주의: 6–7점', '무효: 8점 이상 (과도한 방어·위선)']
                : undefined
            }
            guide={guideOf(VALIDITY_SCALE_LABELS.lie)}
          />
          <ScaleMetricRow
            label={VALIDITY_SCALE_LABELS.infreq}
            measured={`${validity.infreq.itemNos.join('번, ')}번`}
            score={
              isEgoOk99Bank
                ? `${validity.infreq.raw} / ${validity.infreq.max}개 (3점↑)`
                : `${validity.infreq.raw} / ${validity.infreq.max}점`
            }
            status={validity.infreq.status}
            role={
              isEgoOk99Bank
                ? '비현실·과장 진술(감정 부재, 무수면 완벽, 감기 0회 등)에 동의했는지 봅니다.'
                : '흔하지 않은 반응을 골라, 과장이나 무작위 응답 가능성을 봅니다.'
            }
            bands={
              showScoreBands
                ? isEgoOk99Bank
                  ? ['정상: 3점 이상 0–1개', '주의: 3점 이상 1개', '무효: 3점 이상 2개 이상']
                  : ['정상: 3점 이하', '주의: 4–5점', '무효: 6점 이상 (꾀병 또는 무작위 응답)']
                : undefined
            }
            guide={guideOf(VALIDITY_SCALE_LABELS.infreq)}
          />
          <ScaleMetricRow
            label={VALIDITY_SCALE_LABELS.vrin}
            measured={`대립 ${validity.vrin.pairCount}개 문항쌍`}
            score={`${validity.vrin.mismatchPairs} / ${validity.vrin.maxPairs}점`}
            status={validity.vrin.status}
            role="뜻이 반대인 문항에 함께 동의하는지 봐서, 답이 서로 맞는지 확인합니다."
            bands={
              showScoreBands
                ? ['정상: 불일치 없음', '주의: 불일치 1쌍', '무효: 불일치 2쌍 이상 (비일관적)']
                : undefined
            }
            guide={guideOf(VALIDITY_SCALE_LABELS.vrin)}
          />
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
          <p className="text-xs text-slate-500">{validitySpreadLabel(validity)}</p>
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
          <ValidityTable validity={validity} showCounselorGuide />
        </ReportInsightBlock>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-white bg-slate-900/50 p-5 shadow-xl sm:p-6">
      <header className="border-b border-white pb-4">
        <h2 className="text-lg font-semibold text-white">검사 타당도 및 반응 태도 분석</h2>
        <p className="mt-1 text-xs text-slate-500">{validitySpreadLabel(validity)}</p>
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
