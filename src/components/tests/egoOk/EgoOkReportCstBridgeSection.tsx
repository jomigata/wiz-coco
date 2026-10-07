'use client';

import { useMemo, useState } from 'react';
import type { EgoOkReport } from '@/lib/egoOkScoring';
import { buildCstBridgeScores, type CstMajorScore, type CstMiddleScore } from '@/lib/egoOkCstBridgeScoring';
import {
  egoOkReportSectionNumber,
  formatEgoOkSectionTitle,
  useEgoOkReportTabNav,
} from '@/components/tests/egoOk/egoOkReportTabNav';

function MiddleDetail({ middle }: { middle: CstMiddleScore }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-800">{middle.label}</p>
        <p className="font-mono text-sm font-bold tabular-nums text-indigo-700">
          {middle.raw}
          {middle.maxScore > 0 ? (
            <span className="text-xs font-medium text-slate-500"> / {middle.maxScore}</span>
          ) : null}{' '}
          <span className="text-slate-600">{middle.pct}%</span>
        </p>
      </div>
      {middle.itemCount > 0 ? (
        <p className="mt-1 text-[10px] text-slate-500">
          적용 이고-오케이 문항 {middle.itemCount}개 · {middle.formTags}
          {middle.itemNos.length > 0 && middle.itemNos.length <= 24
            ? ` · No.${middle.itemNos.join(',')}`
            : middle.itemNos.length > 24
              ? ` · No.${middle.itemNos.slice(0, 20).join(',')}…`
              : null}
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-slate-500">{middle.formTags}</p>
      )}
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
  const [open, setOpen] = useState(false);
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
            <p className="font-mono text-lg font-bold tabular-nums text-violet-700">{major.pct}%</p>
            {major.maxScore > 0 ? (
              <p className="font-mono text-[10px] text-slate-500">
                {major.raw}/{major.maxScore}
              </p>
            ) : null}
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500">
          {major.itemCount > 0
            ? `근사 매핑 문항 ${major.itemCount}개 · ${major.formTags}`
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
        <h2 className="text-base font-bold text-slate-900">CST 성격강점 · 이고-오케이 90문항 근사 지표</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          긍정심리학 <strong className="font-semibold text-slate-800">대분류 9</strong>를 종합 요약 블록으로
          표시합니다. 중·소분류는 이고-오케이 <strong className="font-semibold text-slate-800">90문항</strong>
          (타당도 6문항 제외) 척도와 근사 매핑한 점수·%이며, 카드를 펼치면 중분류별 간단 결과와 적용 문항
          수를 확인할 수 있습니다. 공식 CST 전용 문항은 별도 시트 미연동입니다.
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
