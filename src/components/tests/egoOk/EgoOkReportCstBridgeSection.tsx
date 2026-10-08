'use client';

import { useMemo, useState } from 'react';
import type { EgoOkReport } from '@/lib/egoOkScoring';
import { buildCstBridgeScores, type CstMajorScore, type CstMiddleScore } from '@/lib/egoOkCstBridgeScoring';
import { formatEnergyStageLine } from '@/lib/egoOkCstBridgeEnergy';
import {
  egoOkReportSectionNumber,
  formatEgoOkSectionTitle,
  useEgoOkReportTabNav,
} from '@/components/tests/egoOk/egoOkReportTabNav';

function ScoreHeadline({
  uniqueItemCount,
  pct,
  energy,
}: {
  uniqueItemCount: number;
  pct: number;
  energy: CstMiddleScore['energy'];
}) {
  return (
    <p className="font-mono text-sm font-bold tabular-nums text-indigo-700">
      {uniqueItemCount > 0 ? `${uniqueItemCount}문항 / ` : ''}
      {pct}%
      <span className="ml-1 text-xs font-semibold text-violet-700">
        · {energy.stage}단계({energy.tierAscii})
      </span>
    </p>
  );
}

function SuitabilityRow({ middle }: { middle: CstMiddleScore }) {
  if (middle.itemCount === 0 && middle.middleId.startsWith('9')) return null;
  return (
    <p className="mt-1 text-[10px] text-slate-500">
      문항 충분성 {middle.quantitySufficiencyPct}% (목표 {middle.targetItemCount}문항) · 내용 적합도{' '}
      {middle.contentSuitabilityPct}% · 종합 적합 {middle.overallSuitabilityPct}%
    </p>
  );
}

function MiddleDetail({ middle }: { middle: CstMiddleScore }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-800">{middle.label}</p>
        <ScoreHeadline uniqueItemCount={middle.uniqueItemCount} pct={middle.pct} energy={middle.energy} />
      </div>
      {middle.itemCount > 0 ? (
        <p className="mt-1 text-[10px] text-slate-500">
          매핑 문항(중복 포함 {middle.itemCount}개) · {middle.formTags}
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-slate-500">{middle.formTags}</p>
      )}
      <SuitabilityRow middle={middle} />
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-700">{middle.reportLine}</p>
      <ul className="mt-2 space-y-0.5 border-t border-slate-200/80 pt-2">
        {middle.minors.map((minor) => (
          <li key={minor.id} className="text-[10px] text-slate-500">
            <span className="font-medium text-slate-600">{minor.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MajorCard({ major }: { major: CstMajorScore }) {
  const nav = useEgoOkReportTabNav();
  const [open, setOpen] = useState(Number(major.majorId) <= 9);
  const tabNo = egoOkReportSectionNumber(major.relatedTabId);
  const barPct = Math.min(100, major.pct);

  const goTab = () => nav?.selectTab(major.relatedTabId);

  return (
    <article className="rounded-xl border border-violet-100 bg-white shadow-sm ring-1 ring-violet-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-2 p-3 text-left transition hover:bg-violet-50/40"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
              대분류 {major.majorId}
            </p>
            <h3 className="text-sm font-bold text-slate-900">{major.label}</h3>
            <p className="text-[10px] text-slate-500">{major.labelEn}</p>
          </div>
          <div className="text-right">
            <ScoreHeadline uniqueItemCount={major.uniqueItemCount} pct={major.pct} energy={major.energy} />
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="text-[10px] leading-snug text-slate-500">
          {formatEnergyStageLine(major.energy)} {major.energy.balanceComment.slice(0, 72)}…
        </p>
        <p className="text-[10px] text-slate-500">
          {major.uniqueItemCount > 0
            ? `합계 ${major.uniqueItemCount}문항 / ${major.pct}% · ${major.formTags}`
            : major.formTags}
          {tabNo != null ? (
            <span className="ml-1 text-violet-600">
              · {formatEgoOkSectionTitle(tabNo, '상세')} ({open ? '접기' : '펼치기'})
            </span>
          ) : null}
        </p>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-violet-100 px-3 pb-3 pt-2">
          {major.middles.map((middle) => (
            <MiddleDetail key={middle.middleId} middle={middle} />
          ))}
          <button
            type="button"
            onClick={goTab}
            className="w-full rounded-lg border border-violet-200 bg-violet-50 py-1.5 text-[11px] font-semibold text-violet-800 hover:bg-violet-100"
          >
            → {formatEgoOkSectionTitle(tabNo, '연결 탭')} 이동
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function EgoOkReportCstBridgeSection({
  report,
  className,
}: {
  report: EgoOkReport;
  className?: string;
}) {
  const majors = useMemo(() => buildCstBridgeScores(report), [report]);

  return (
    <section
      className={`mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/25 to-white p-4 ring-1 ring-violet-50 ${className ?? ''}`}
    >
      <header className="mb-4 border-b border-violet-100/80 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          CST·통합 성격·임상 척도 (이고-오케이 90~96문항 근사)
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          긍정심리학 CST(1~9)와 IIP·MPD·NEO·Station·KDS·IESS·SRI·SCI-II·MindFit·SAED(10~19)를 한
          체계로 정리했습니다. 각 척도는 <strong className="font-semibold text-slate-800">문항수 / %</strong>
          와 <strong className="font-semibold text-slate-800">243+ 9단계 에너지 빈도</strong>를 표시하며,{' '}
          <strong className="font-semibold text-emerald-700">권장 구간은 4~6단계</strong>입니다. 1~3단계는
          부족(장점·과제), 7~9단계는 과함(장점·과제) 코멘트를 함께 봅니다. 문항 충분성·내용 적합도·종합
          적합도는 이고-오케이 문항으로 원 척도를 근사할 때의 참고 지표입니다.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {majors.map((major) => (
          <MajorCard key={major.majorId} major={major} />
        ))}
      </div>
    </section>
  );
}
